<script lang="ts">
	/**
	 * 弹幕层组件
	 * Canvas 渲染弹幕，支持滚动弹幕、顶部固定弹幕、弹幕发送
	 * 优化：使用对象池、批量渲染、RAF 节流、内存管理
	 * 增强：集成 WebSocket 实时弹幕、VIP 弹幕特殊样式、在线人数显示
	 */
	import { onMount, onDestroy } from 'svelte';
	import type { Danmaku } from '$lib/types';
	import { PLAYER_CONFIG, VIP_DANMAKU_COLORS } from '$lib/constants';
	import { getDanmakuWS, destroyDanmakuWS } from '$lib/danmaku/websocket';
	import type { DanmakuWS } from '$lib/danmaku/websocket';

	interface Props {
		danmakus?: Danmaku[];
		visible?: boolean;
		opacity?: number;
		fontSize?: number;
		onSend?: (content: string) => void;
		videoId?: string;
	}

	let {
		danmakus = [],
		visible = true,
		opacity = PLAYER_CONFIG.DANMAKU_OPACITY,
		fontSize = PLAYER_CONFIG.DANMAKU_FONT_SIZE,
		onSend,
		videoId = ''
	}: Props = $props();

	// ========== Canvas 相关 ==========
	let canvasEl: HTMLCanvasElement | null = $state(null);
	let ctx: CanvasRenderingContext2D | null = null;
	let canvasWidth = $state(0);
	let canvasHeight = $state(0);
	let dpr = 1;

	// ========== 弹幕配置 ==========
	const trackHeight = 30;
	const maxActiveDanmakus = 100; // 最大活跃弹幕数
	const poolSize = 50; // 对象池大小

	// ========== 弹幕对象池 ==========
	interface ActiveDanmaku {
		id: string;
		text: string;
		x: number;
		y: number;
		color: string;
		speed: number;
		type: 'scroll' | 'top' | 'bottom';
		width: number;
		createTime: number;
		isActive: boolean;
	}

	// 使用 Map 存储活跃弹幕，提高查找效率
	let activeDanmakus = new Map<string, ActiveDanmaku>();
	let danmakuPool: ActiveDanmaku[] = [];

	// ========== 输入框状态 ==========
	let inputText = $state('');
	let showInput = $state(false);

	// ========== 动画控制 ==========
	let animationId: number | null = null;
	let lastFrameTime = 0;
	let isPaused = false;
	let isDestroyed = false;

	// ========== 轨道管理 ==========
	let occupiedTracks = new Set<number>();

	// ========== WebSocket 实时弹幕 ==========

	let danmakuWS: DanmakuWS | null = null;
	let onlineCount = $state(0);
	let wsConnected = $state(false);

	/**
	 * 初始化 WebSocket 弹幕连接
	 */
	function initDanmakuWS(): void {
		if (!videoId) return;

		danmakuWS = getDanmakuWS();

		// 注册弹幕消息回调
		danmakuWS.onMessage((danmaku: Danmaku) => {
			// 实时弹幕直接添加到画面
			addDanmaku(danmaku);
		});

		// 注册在线人数回调
		danmakuWS.onOnlineCount((count: number) => {
			onlineCount = count;
		});

		// 注册连接状态回调
		danmakuWS.onStateChange((state) => {
			wsConnected = state === 'connected';
		});

		// 连接 WebSocket
		danmakuWS.connect(videoId);
	}

	/**
	 * 断开 WebSocket 弹幕连接
	 */
	function disconnectDanmakuWS(): void {
		if (danmakuWS) {
			danmakuWS.disconnect();
			danmakuWS = null;
		}
		onlineCount = 0;
		wsConnected = false;
	}

	// ========== 初始化 ==========

	/**
	 * 初始化 Canvas
	 */
	function initCanvas(): void {
		if (!canvasEl) return;

		const rect = canvasEl.parentElement?.getBoundingClientRect();
		if (!rect) return;

		canvasWidth = rect.width;
		canvasHeight = rect.height;
		dpr = window.devicePixelRatio || 1;

		canvasEl.width = canvasWidth * dpr;
		canvasEl.height = canvasHeight * dpr;
		canvasEl.style.width = `${canvasWidth}px`;
		canvasEl.style.height = `${canvasHeight}px`;

		ctx = canvasEl.getContext('2d', {
			alpha: true,
			desynchronized: true // 使用非同步渲染提升性能
		});

		if (ctx) {
			ctx.scale(dpr, dpr);
			ctx.textBaseline = 'top';
		}

		// 初始化对象池
		initPool();
	}

	/**
	 * 初始化对象池
	 */
	function initPool(): void {
		danmakuPool = [];
		for (let i = 0; i < poolSize; i++) {
			danmakuPool.push({
				id: '',
				text: '',
				x: 0,
				y: 0,
				color: '',
				speed: 0,
				type: 'scroll',
				width: 0,
				createTime: 0,
				isActive: false
			});
		}
	}

	/**
	 * 从对象池获取弹幕对象
	 */
	function getFromPool(): ActiveDanmaku | null {
		for (const item of danmakuPool) {
			if (!item.isActive) {
				item.isActive = true;
				return item;
			}
		}
		return null;
	}

	/**
	 * 回收弹幕对象到对象池
	 */
	function returnToPool(item: ActiveDanmaku): void {
		item.isActive = false;
		item.id = '';
		item.text = '';
	}

	// ========== 轨道管理 ==========

	/**
	 * 计算轨道数
	 */
	function getTrackCount(): number {
		return Math.max(3, Math.floor(canvasHeight / trackHeight));
	}

	/**
	 * 获取可用轨道
	 */
	function getAvailableTrack(): number {
		const trackCount = getTrackCount();

		// 清理已释放的轨道
		for (const track of occupiedTracks) {
			let stillOccupied = false;
			for (const d of activeDanmakus.values()) {
				if (d.type === 'scroll' && Math.floor(d.y / trackHeight) === track) {
					// 检查是否已离开屏幕足够距离
					if (d.x + d.width < canvasWidth * 0.7) {
						stillOccupied = false;
					} else {
						stillOccupied = true;
					}
					break;
				}
			}
			if (!stillOccupied) {
				occupiedTracks.delete(track);
			}
		}

		// 寻找空闲轨道
		for (let i = 0; i < trackCount; i++) {
			if (!occupiedTracks.has(i)) {
				occupiedTracks.add(i);
				return i;
			}
		}

		// 所有轨道都被占用，随机选择一个
		return Math.floor(Math.random() * trackCount);
	}

	// ========== 弹幕管理 ==========

	/**
	 * 添加弹幕
	 */
	function addDanmaku(danmaku: Danmaku): void {
		if (!ctx || !visible || isDestroyed) return;

		// 限制活跃弹幕数量
		if (activeDanmakus.size >= maxActiveDanmakus) {
			// 移除最旧的弹幕
			let oldest: ActiveDanmaku | null = null;
			for (const d of activeDanmakus.values()) {
				if (!oldest || d.createTime < oldest.createTime) {
					oldest = d;
				}
			}
			if (oldest) {
				activeDanmakus.delete(oldest.id);
				returnToPool(oldest);
			}
		}

		// 从对象池获取
		const item = getFromPool();
		if (!item) return;

		// 测量文本宽度
		ctx.font = `bold ${fontSize}px sans-serif`;
		const textWidth = ctx.measureText(danmaku.content).width;

		const track = getAvailableTrack();
		const baseY = track * trackHeight + fontSize;

		item.id = danmaku.id || `${Date.now()}_${Math.random()}`;
		item.text = danmaku.content;
		item.color = danmaku.color || '#FFFFFF';
		item.width = textWidth;
		item.createTime = Date.now();

		if (danmaku.type === 'top') {
			item.x = (canvasWidth - textWidth) / 2;
			item.y = baseY;
			item.speed = 0;
			item.type = 'top';

			// 3秒后移除
			setTimeout(() => {
				if (!isDestroyed) {
					const d = activeDanmakus.get(item.id);
					if (d) {
						activeDanmakus.delete(item.id);
						returnToPool(d);
					}
				}
			}, 3000);
		} else if (danmaku.type === 'bottom') {
			item.x = (canvasWidth - textWidth) / 2;
			item.y = canvasHeight - baseY;
			item.speed = 0;
			item.type = 'bottom';

			setTimeout(() => {
				if (!isDestroyed) {
					const d = activeDanmakus.get(item.id);
					if (d) {
						activeDanmakus.delete(item.id);
						returnToPool(d);
					}
				}
			}, 3000);
		} else {
			item.x = canvasWidth;
			item.y = baseY;
			item.speed = PLAYER_CONFIG.DANMAKU_SPEED + Math.random() * 40;
			item.type = 'scroll';
		}

		activeDanmakus.set(item.id, item);
	}

	/**
	 * 批量添加弹幕（用于初始化历史弹幕）
	 */
	function batchAddDanmakus(danmakuList: Danmaku[]): void {
		// 分批添加，避免阻塞
		const batchSize = 5;
		let index = 0;

		function addBatch() {
			if (isDestroyed) return;
			const batch = danmakuList.slice(index, index + batchSize);
			batch.forEach(addDanmaku);
			index += batchSize;

			if (index < danmakuList.length) {
				requestAnimationFrame(addBatch);
			}
		}

		addBatch();
	}

	// ========== 渲染循环 ==========

	/**
	 * 渲染循环（使用 RAF 节流）
	 */
	function render(currentTime: number): void {
		if (isDestroyed) return;

		// 节流：限制为 60fps
		const deltaTime = currentTime - lastFrameTime;
		if (deltaTime < 16) {
			animationId = requestAnimationFrame(render);
			return;
		}
		lastFrameTime = currentTime;

		if (!ctx || !visible || isPaused) {
			animationId = requestAnimationFrame(render);
			return;
		}

		// 清空画布
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		if (activeDanmakus.size === 0) {
			animationId = requestAnimationFrame(render);
			return;
		}

		ctx.globalAlpha = opacity;

		// 批量渲染
		const toRemove: string[] = [];

		for (const d of activeDanmakus.values()) {
			// 绘制文字阴影
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowBlur = 2;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;

			// 绘制文字
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.fillStyle = d.color;
			ctx.fillText(d.text, d.x, d.y);

			// 重置阴影
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;

			// 更新位置
			if (d.type === 'scroll') {
				d.x -= d.speed * (deltaTime / 1000);

				// 超出屏幕则标记移除
				if (d.x + d.width < -50) {
					toRemove.push(d.id);
				}
			}
		}

		// 移除超出屏幕的弹幕
		for (const id of toRemove) {
			const d = activeDanmakus.get(id);
			if (d) {
				activeDanmakus.delete(id);
				returnToPool(d);
			}
		}

		ctx.globalAlpha = 1;
		animationId = requestAnimationFrame(render);
	}

	// ========== 用户交互 ==========

	/**
	 * 发送弹幕
	 */
	function sendDanmaku(): void {
		const content = inputText.trim();
		if (!content) return;

		// 检查内容长度
		if (content.length > 100) {
			alert('弹幕内容不能超过100字');
			return;
		}

		onSend?.(content);
		inputText = '';
		showInput = false;

		// 立即显示自己发送的弹幕
		addDanmaku({
			id: `self_${Date.now()}`,
			time: 0,
			content,
			color: '#FB7299',
			type: 'scroll',
			font_size: fontSize,
			user_id: 'self'
		});
	}

	/**
	 * 清空所有弹幕
	 */
	function clearDanmakus(): void {
		for (const d of activeDanmakus.values()) {
			returnToPool(d);
		}
		activeDanmakus.clear();
		occupiedTracks.clear();
	}

	/**
	 * 暂停/恢复弹幕
	 */
	function togglePause(): void {
		isPaused = !isPaused;
	}

	// ========== 生命周期 ==========

	/**
	 * 监听弹幕列表变化
	 */
	$effect(() => {
		if (danmakus.length > 0 && visible) {
			// 使用批量添加避免阻塞
			batchAddDanmakus(danmakus);
		}
	});

	onMount(() => {
		initCanvas();
		animationId = requestAnimationFrame(render);

		// 初始化 WebSocket 弹幕连接
		initDanmakuWS();

		const handleResize = () => {
			// 使用防抖
			if (resizeTimeout) clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				initCanvas();
			}, 100);
		};

		let resizeTimeout: ReturnType<typeof setTimeout>;
		window.addEventListener('resize', handleResize);

		// 页面可见性变化时暂停/恢复
		const handleVisibilityChange = () => {
			isPaused = document.hidden;
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('resize', handleResize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (resizeTimeout) clearTimeout(resizeTimeout);
		};
	});

	onDestroy(() => {
		isDestroyed = true;

		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}

		clearDanmakus();

		// 断开 WebSocket 弹幕连接
		disconnectDanmakuWS();
	});
</script>

<div class="absolute inset-0 overflow-hidden pointer-events-none" style="z-index: 10;">
	<canvas bind:this={canvasEl} class="w-full h-full"></canvas>
</div>

<!-- 弹幕开关和发送按钮 -->
<div class="absolute top-2 right-2 flex gap-2" style="z-index: 20;">
	<!-- 在线人数 -->
	{#if wsConnected}
		<div class="px-2 py-1 text-xs rounded bg-black/50 text-white flex items-center gap-1">
			<div class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
			<span>{onlineCount}</span>
		</div>
	{/if}

	<!-- 弹幕开关 -->
	<button
		onclick={() => visible = !visible}
		class="px-2 py-1 text-xs rounded bg-black/50 text-white btn-press pointer-events-auto"
		aria-label={visible ? '关闭弹幕' : '开启弹幕'}
	>
		{visible ? '弹幕开' : '弹幕关'}
	</button>

	<!-- 暂停/恢复 -->
	<button
		onclick={togglePause}
		class="px-2 py-1 text-xs rounded bg-black/50 text-white btn-press pointer-events-auto"
		aria-label={isPaused ? '恢复弹幕' : '暂停弹幕'}
	>
		{isPaused ? '已暂停' : '滚动中'}
	</button>

	<!-- 发送弹幕按钮 -->
	<button
		onclick={() => showInput = !showInput}
		class="px-2 py-1 text-xs rounded bg-bilibili/80 text-white btn-press pointer-events-auto"
	>
		发弹幕
	</button>
</div>

<!-- 弹幕输入框 -->
{#if showInput}
	<div class="absolute bottom-12 left-2 right-2 flex gap-2" style="z-index: 20;">
		<input
			type="text"
			bind:value={inputText}
			placeholder="发送一条弹幕..."
			maxlength="100"
			class="flex-1 px-3 py-1.5 text-sm bg-black/60 text-white rounded-full border border-white/20 outline-none placeholder:text-white/40 pointer-events-auto"
			onkeydown={(e) => e.key === 'Enter' && sendDanmaku()}
		/>
		<button
			onclick={sendDanmaku}
			class="px-3 py-1.5 text-sm bg-bilibili text-white rounded-full btn-press pointer-events-auto"
		>
			发送
		</button>
	</div>
{/if}
