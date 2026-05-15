<script lang="ts">
	/**
	 * 弹幕层组件
	 * Canvas 渲染弹幕，支持滚动弹幕、顶部固定弹幕、弹幕发送
	 */
	import { onMount } from 'svelte';
	import type { Danmaku } from '$lib/types';
	import { PLAYER_CONFIG } from '$lib/constants';

	interface Props {
		danmakus?: Danmaku[];
		visible?: boolean;
		opacity?: number;
		fontSize?: number;
		onSend?: (content: string) => void;
	}

	let {
		danmakus = [],
		visible = true,
		opacity = PLAYER_CONFIG.DANMAKU_OPACITY,
		fontSize = PLAYER_CONFIG.DANMAKU_FONT_SIZE,
		onSend
	}: Props = $props();

	// Canvas 相关
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let canvasWidth = $state(0);
	let canvasHeight = $state(0);

	// 弹幕轨道
	let tracks: number[] = $state([]);
	const trackHeight = 30;

	// 活跃弹幕列表
	let activeDanmakus = $state<{
		text: string;
		x: number;
		y: number;
		color: string;
		speed: number;
		type: 'scroll' | 'top';
		width: number;
	}[]>([]);

	// 输入框
	let inputText = $state('');
	let showInput = $state(false);

	// 动画帧
	let animationId: number | null = null;

	// 初始化 Canvas
	function initCanvas() {
		if (!canvasEl) return;
		const rect = canvasEl.parentElement?.getBoundingClientRect();
		if (!rect) return;

		canvasWidth = rect.width;
		canvasHeight = rect.height;

		const dpr = window.devicePixelRatio || 1;
		canvasEl.width = canvasWidth * dpr;
		canvasEl.height = canvasHeight * dpr;
		canvasEl.style.width = `${canvasWidth}px`;
		canvasEl.style.height = `${canvasHeight}px`;

		ctx = canvasEl.getContext('2d');
		if (ctx) {
			ctx.scale(dpr, dpr);
		}

		// 计算轨道数
		const trackCount = Math.floor(canvasHeight / trackHeight);
		tracks = Array.from({ length: trackCount }, (_, i) => i);
	}

	// 获取空闲轨道
	function getAvailableTrack(): number {
		const usedTracks = new Set(
			activeDanmakus
				.filter((d) => d.type === 'scroll' && d.x + d.width < canvasWidth * 0.8)
				.map((d) => Math.floor(d.y / trackHeight))
		);

		for (const track of tracks) {
			if (!usedTracks.has(track)) return track;
		}
		return Math.floor(Math.random() * tracks.length);
	}

	// 添加弹幕
	function addDanmaku(danmaku: Danmaku) {
		if (!ctx) return;

		// 测量文本宽度
		ctx.font = `${fontSize}px sans-serif`;
		const textWidth = ctx.measureText(danmaku.content).width;

		if (danmaku.type === 'top') {
			// 顶部固定弹幕
			const track = getAvailableTrack();
			activeDanmakus.push({
				text: danmaku.content,
				x: (canvasWidth - textWidth) / 2,
				y: track * trackHeight + fontSize,
				color: danmaku.color || '#FFFFFF',
				speed: 0,
				type: 'top',
				width: textWidth
			});

			// 3秒后移除
			setTimeout(() => {
				activeDanmakus = activeDanmakus.filter((d) => d.text !== danmaku.content || d.type !== 'top');
			}, 3000);
		} else {
			// 滚动弹幕
			const track = getAvailableTrack();
			activeDanmakus.push({
				text: danmaku.content,
				x: canvasWidth,
				y: track * trackHeight + fontSize,
				color: danmaku.color || '#FFFFFF',
				speed: PLAYER_CONFIG.DANMAKU_SPEED + Math.random() * 40,
				type: 'scroll',
				width: textWidth
			});
		}
	}

	// 渲染循环
	function render() {
		if (!ctx || !visible) {
			animationId = requestAnimationFrame(render);
			return;
		}

		// 清空画布
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		ctx.globalAlpha = opacity;

		// 绘制弹幕
		const toRemove: number[] = [];

		for (let i = 0; i < activeDanmakus.length; i++) {
			const d = activeDanmakus[i];

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
				d.x -= d.speed / 60; // 60fps

				// 超出屏幕则标记移除
				if (d.x + d.width < 0) {
					toRemove.push(i);
				}
			}
		}

		// 移除超出屏幕的弹幕
		if (toRemove.length > 0) {
			activeDanmakus = activeDanmakus.filter((_, i) => !toRemove.includes(i));
		}

		ctx.globalAlpha = 1;
		animationId = requestAnimationFrame(render);
	}

	// 发送弹幕
	function sendDanmaku() {
		if (!inputText.trim()) return;
		onSend?.(inputText.trim());
		inputText = '';
		showInput = false;
	}

	// 监听弹幕列表变化
	$effect(() => {
		danmakus.forEach((danmaku) => {
			addDanmaku(danmaku);
		});
	});

	onMount(() => {
		initCanvas();
		render();

		const handleResize = () => initCanvas();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationId) cancelAnimationFrame(animationId);
		};
	});
</script>

<div class="absolute inset-0 overflow-hidden pointer-events-none" style="z-index: 10;">
	<canvas bind:this={canvasEl} class="w-full h-full"></canvas>
</div>

<!-- 弹幕开关和发送按钮 -->
<div class="absolute top-2 right-2 flex gap-2" style="z-index: 20;">
	<!-- 弹幕开关 -->
	<button
		onclick={() => visible = !visible}
		class="px-2 py-1 text-xs rounded bg-black/50 text-white btn-press"
	>
		{visible ? '弹幕开' : '弹幕关'}
	</button>

	<!-- 发送弹幕按钮 -->
	<button
		onclick={() => showInput = !showInput}
		class="px-2 py-1 text-xs rounded bg-bilibili/80 text-white btn-press"
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
			class="flex-1 px-3 py-1.5 text-sm bg-black/60 text-white rounded-full border border-white/20 outline-none placeholder:text-white/40"
			onkeydown={(e) => e.key === 'Enter' && sendDanmaku()}
		/>
		<button
			onclick={sendDanmaku}
			class="px-3 py-1.5 text-sm bg-bilibili text-white rounded-full btn-press"
		>
			发送
		</button>
	</div>
{/if}
