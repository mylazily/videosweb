<script lang="ts">
	/**
	 * 智能容灾视频播放器组件
	 * 核心功能：
	 * - 多线路自动切换（容灾）
	 * - 域名池无感切换
	 * - 进度条同步（切线后恢复播放进度）
	 * - 6 秒加载超时
	 * - 最多重试 2 次当前线路，然后切换下一条
	 * - WebSocket 弹幕连接
	 * - Svelte 5 runes ($state, $effect, $props, $derived)
	 */
	import { onMount, onDestroy } from 'svelte';
	import Hls from 'hls.js';
	import { decryptPlayUrl } from '$lib/crypto';
	import { formatDuration } from '$lib/utils';
	import { PLAYER_CONFIG } from '$lib/constants';
	import type { PlayLine, PlayerState, PlayerCallbacks } from '$lib/types';
	import { getDanmakuWS } from '$lib/danmaku/websocket';
	import type { DanmakuWS } from '$lib/danmaku/websocket';

	// ========== Props ==========

	interface Props {
		playLines: PlayLine[];
		domainPool?: string[];
		sharedPath?: string;
		videoId?: string;
		onLineChange?: (index: number) => void;
		autoPlay?: boolean;
		startTime?: number;
		poster?: string;
		callbacks?: PlayerCallbacks;
	}

	let {
		playLines = [],
		domainPool = [],
		sharedPath = '',
		videoId = '',
		onLineChange,
		autoPlay = PLAYER_CONFIG.AUTO_PLAY,
		startTime = 0,
		poster = '',
		callbacks
	}: Props = $props();

	// ========== 播放器状态 ==========

	let videoEl: HTMLVideoElement | null = $state(null);
	let hlsInstance: Hls | null = $state(null);
	let currentLineIndex = $state(0);
	let playerState = $state<PlayerState>('idle');
	let errorMessage = $state('');
	let retryCount = $state(0);
	let lastPlayTime = $state(0);
	let isLoading = $state(false);
	let showLineSwitchToast = $state(false);
	let lineSwitchMessage = $state('');
	let onlineCount = $state(0);

	// 播放控制状态
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let buffered = $state(0);
	let volume = $state(PLAYER_CONFIG.DEFAULT_VOLUME);
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let showControls = $state(true);

	// 域名池切换索引
	let domainPoolIndex = $state(0);

	// 定时器和引用
	let progressTimer: ReturnType<typeof setInterval> | null = null;
	let hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
	let loadTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let isDestroyed = false;

	// WebSocket 弹幕连接
	let danmakuWS: DanmakuWS | null = null;

	// 容灾常量
	const MAX_RETRY_PER_LINE = 2;     // 每条线路最多重试次数
	const LOAD_TIMEOUT_MS = 6000;      // 加载超时 6 秒
	const TOAST_DURATION_MS = 3000;    // Toast 显示时长

	// ========== 派生状态 ==========

	const currentLine = $derived(playLines[currentLineIndex] || null);
	const formattedCurrentTime = $derived(formatDuration(currentTime));
	const formattedDuration = $derived(formatDuration(duration));
	const progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
	const bufferedPercent = $derived(duration > 0 ? (buffered / duration) * 100 : 0);

	// ========== WebSocket 弹幕 ==========

	/** 连接弹幕 WebSocket */
	function connectDanmakuWS(): void {
		if (!videoId) return;
		danmakuWS = getDanmakuWS();
		danmakuWS.connect(videoId);
	}

	/** 断开弹幕 WebSocket */
	function disconnectDanmakuWS(): void {
		if (danmakuWS) {
			danmakuWS.disconnect();
			danmakuWS = null;
		}
	}

	// ========== Toast 提示 ==========

	/** 显示切线 Toast 提示 */
	function showToast(message: string): void {
		lineSwitchMessage = message;
		showLineSwitchToast = true;

		if (toastTimer) {
			clearTimeout(toastTimer);
		}
		toastTimer = setTimeout(() => {
			showLineSwitchToast = false;
		}, TOAST_DURATION_MS);
	}

	// ========== 播放器初始化和销毁 ==========

	/**
	 * 初始化/切换播放器
	 * @param lineIndex 线路索引
	 */
	function initPlayer(lineIndex: number): void {
		if (!videoEl || isDestroyed) return;

		const line = playLines[lineIndex];
		if (!line) return;

		// 销毁旧播放器实例（防止内存泄漏）
		destroyPlayer();

		// 重置错误状态
		errorMessage = '';
		playerState = 'loading';
		isLoading = true;

		// 获取 m3u8 URL
		let playUrl = line.m3u8_url;

		// 如果需要 XOR 解密，先解密
		if (playUrl.includes('==') || playUrl.length > 100) {
			try {
				const decrypted = decryptPlayUrl(playUrl);
				if (decrypted.startsWith('http')) {
					playUrl = decrypted;
				}
			} catch {
				// 解密失败，使用原始地址
			}
		}

		// 设置 6 秒加载超时
		loadTimeoutTimer = setTimeout(() => {
			if (playerState === 'loading') {
				console.warn('[播放器] 加载超时，触发容灾切换');
				handleNetworkError();
			}
		}, LOAD_TIMEOUT_MS);

		try {
			if (Hls.isSupported() && playUrl.includes('.m3u8')) {
				initHlsPlayer(playUrl);
			} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
				initNativeHlsPlayer(playUrl);
			} else {
				initStandardPlayer(playUrl);
			}
		} catch (error) {
			clearLoadTimeout();
			handleNetworkError();
		}
	}

	/**
	 * 初始化 hls.js 播放器
	 */
	function initHlsPlayer(playUrl: string): void {
		if (!videoEl || isDestroyed) return;

		const hls = new Hls({
			maxBufferLength: PLAYER_CONFIG.MAX_BUFFER_LENGTH,
			maxMaxBufferLength: 60,
			startLevel: -1,
			enableWorker: true,
			fragLoadingMaxRetry: 2,
			manifestLoadingMaxRetry: 2,
			levelLoadingMaxRetry: 2
		});

		hls.loadSource(playUrl);
		hls.attachMedia(videoEl);

		// m3u8 清单解析成功
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			if (isDestroyed) return;
			clearLoadTimeout();
			playerState = 'playing';
			isLoading = false;

			// 恢复播放进度
			recoverProgress();

			// 自动播放
			if (autoPlay) {
				videoEl?.play().catch(() => {
					isPlaying = false;
					playerState = 'paused';
				});
			}
		});

		// 切片加载成功（取消超时）
		hls.on(Hls.Events.FRAG_LOADED, () => {
			if (isDestroyed) return;
			clearLoadTimeout();
			isLoading = false;
			playerState = 'playing';
		});

		// 错误处理
		hls.on(Hls.Events.ERROR, (_event, data) => {
			if (isDestroyed) return;

			if (data.fatal) {
				switch (data.type) {
					case Hls.ErrorTypes.NETWORK_ERROR:
						clearLoadTimeout();
						handleNetworkError();
						break;
					case Hls.ErrorTypes.MEDIA_ERROR:
						hls.recoverMediaError();
						break;
					default:
						clearLoadTimeout();
						handleNetworkError();
						break;
				}
			}
		});

		hlsInstance = hls;
	}

	/**
	 * 初始化 Safari 原生 HLS 播放器
	 */
	function initNativeHlsPlayer(playUrl: string): void {
		if (!videoEl || isDestroyed) return;

		videoEl.src = playUrl;
		videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
		videoEl.addEventListener('error', handleVideoError);
	}

	/**
	 * 初始化标准视频播放器
	 */
	function initStandardPlayer(playUrl: string): void {
		if (!videoEl || isDestroyed) return;

		videoEl.src = playUrl;
		videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
		videoEl.addEventListener('error', handleVideoError);
	}

	/** 处理元数据加载完成 */
	function handleLoadedMetadata(): void {
		if (isDestroyed) return;
		clearLoadTimeout();
		playerState = 'playing';
		isLoading = false;

		// 恢复播放进度
		recoverProgress();

		if (autoPlay) {
			videoEl?.play().catch(() => {});
		}
	}

	/** 处理视频错误 */
	function handleVideoError(): void {
		if (isDestroyed) return;
		clearLoadTimeout();
		handleNetworkError();
	}

	// ========== 容灾逻辑 ==========

	/**
	 * 网络错误处理（核心容灾逻辑）
	 * - retryCount <= 2: 重试当前线路
	 * - retryCount > 2: 切换到下一条线路
	 * - 所有线路失败: 尝试域名池或显示错误
	 */
	function handleNetworkError(): void {
		if (isDestroyed) return;

		retryCount++;

		if (retryCount <= MAX_RETRY_PER_LINE) {
			// 重试当前线路（可能是临时网络波动）
			console.log(`[播放器] 重试当前线路 (${retryCount}/${MAX_RETRY_PER_LINE})`);
			showToast(`连接不稳定，正在重试 (${retryCount}/${MAX_RETRY_PER_LINE})...`);

			// 短暂延迟后重试
			setTimeout(() => {
				if (!isDestroyed) {
					initPlayer(currentLineIndex);
				}
			}, 1000);
			return;
		}

		// 重试次数耗尽，切换到下一条线路
		const nextLineIndex = currentLineIndex + 1;

		if (nextLineIndex < playLines.length) {
			// 记录当前播放时间
			lastPlayTime = videoEl?.currentTime || 0;
			currentLineIndex = nextLineIndex;
			retryCount = 0;

			const lineName = playLines[nextLineIndex].source_name;
			console.log(`[播放器] 切换到线路 ${nextLineIndex + 1}: ${lineName}`);
			showToast(`当前线路连接超时，已为您切换至 ${lineName}`);

			// 通知父组件线路已切换
			onLineChange?.(nextLineIndex);

			// 延迟切换，给用户看到提示
			playerState = 'switching';
			setTimeout(() => {
				if (!isDestroyed) {
					initPlayer(nextLineIndex);
				}
			}, 800);
		} else {
			// 所有线路都失败
			// 尝试域名池切换
			if (domainPool.length > 0 && sharedPath) {
				handleDomainPoolSwitch();
			} else {
				// 彻底失败
				playerState = 'error';
				isLoading = false;
				errorMessage = '所有采集源在您当前地区均无法连接，请稍后再试';
				callbacks?.onError?.(errorMessage);
				destroyPlayer();
			}
		}
	}

	/**
	 * 域名池无感切换
	 * 仅当 sharedPath 存在且 domainPool 不为空时可用
	 * 将 m3u8 URL 中的域名替换为 domainPool 中的下一个域名
	 */
	function handleDomainPoolSwitch(): void {
		if (!sharedPath || domainPool.length === 0) return;

		// 记录当前播放时间
		lastPlayTime = videoEl?.currentTime || 0;

		// 获取下一个域名
		const nextDomain = domainPool[domainPoolIndex % domainPool.length];
		domainPoolIndex++;

		// 构建新的 m3u8 URL
		const newUrl = `${nextDomain}${sharedPath}`;

		console.log(`[播放器] 域名池切换: ${nextDomain}`);
		showToast(`正在切换备用节点...`);

		playerState = 'switching';

		// 销毁旧播放器
		destroyPlayer();

		// 用新域名重新初始化
		setTimeout(() => {
			if (!isDestroyed && videoEl) {
				errorMessage = '';
				isLoading = true;

				// 设置超时
				loadTimeoutTimer = setTimeout(() => {
					if (playerState === 'loading' || playerState === 'switching') {
						// 域名池也失败了
						playerState = 'error';
						isLoading = false;
						errorMessage = '所有采集源在您当前地区均无法连接，请稍后再试';
						callbacks?.onError?.(errorMessage);
					}
				}, LOAD_TIMEOUT_MS);

				try {
					if (Hls.isSupported()) {
						initHlsPlayer(newUrl);
					} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
						initNativeHlsPlayer(newUrl);
					} else {
						initStandardPlayer(newUrl);
					}
				} catch {
					playerState = 'error';
					isLoading = false;
					errorMessage = '备用节点连接失败';
				}
			}
		}, 500);
	}

	/**
	 * 恢复播放进度
	 * 切线后尝试恢复到上次播放时间
	 */
	function recoverProgress(): void {
		if (!videoEl || lastPlayTime <= 0) return;

		try {
			videoEl.currentTime = lastPlayTime;
			console.log(`[播放器] 恢复播放进度: ${lastPlayTime}s`);
		} catch {
			// 进度恢复失败，忽略
		}
	}

	/**
	 * 手动切换线路
	 * @param index 目标线路索引
	 */
	function switchLine(index: number): void {
		if (index === currentLineIndex || index < 0 || index >= playLines.length) return;

		// 记录当前播放时间
		lastPlayTime = videoEl?.currentTime || 0;
		currentLineIndex = index;
		retryCount = 0;

		const lineName = playLines[index].source_name;
		showToast(`已切换至 ${lineName}`);

		// 通知父组件
		onLineChange?.(index);

		// 切换播放器
		playerState = 'switching';
		setTimeout(() => {
			if (!isDestroyed) {
				initPlayer(index);
			}
		}, 300);
	}

	/**
	 * 清除加载超时定时器
	 */
	function clearLoadTimeout(): void {
		if (loadTimeoutTimer) {
			clearTimeout(loadTimeoutTimer);
			loadTimeoutTimer = null;
		}
	}

	/**
	 * 销毁播放器（防止内存泄漏）
	 */
	function destroyPlayer(): void {
		clearLoadTimeout();

		// 清理进度上报定时器
		if (progressTimer) {
			clearInterval(progressTimer);
			progressTimer = null;
		}

		// 销毁 hls.js 实例
		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}

		// 清理视频元素事件监听
		if (videoEl) {
			videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
			videoEl.removeEventListener('error', handleVideoError);
			videoEl.src = '';
			videoEl.load();
		}
	}

	// ========== 播放控制 ==========

	/** 播放/暂停切换 */
	function togglePlay(): void {
		if (!videoEl || playerState === 'error') return;

		if (isPlaying) {
			videoEl.pause();
		} else {
			videoEl.play().catch(() => {});
		}
	}

	/** 跳转进度 */
	function seek(e: MouseEvent): void {
		if (!videoEl || !duration || playerState === 'error') return;

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const percent = (e.clientX - rect.left) / rect.width;
		const newTime = percent * duration;

		videoEl.currentTime = newTime;
		currentTime = newTime;
	}

	/** 全屏切换 */
	async function toggleFullscreen(): Promise<void> {
		if (!videoEl) return;

		const container = videoEl.parentElement;
		if (!container) return;

		try {
			if (!document.fullscreenElement) {
				await container.requestFullscreen();
				isFullscreen = true;
			} else {
				await document.exitFullscreen();
				isFullscreen = false;
			}
		} catch {
			// 全屏切换失败
		}
	}

	/** 静音切换 */
	function toggleMute(): void {
		if (!videoEl) return;
		videoEl.muted = !videoEl.muted;
		isMuted = videoEl.muted;
	}

	/** 重试播放（重置所有线路） */
	function retryPlay(): void {
		currentLineIndex = 0;
		retryCount = 0;
		domainPoolIndex = 0;
		lastPlayTime = 0;
		playerState = 'idle';
		errorMessage = '';
		initPlayer(0);
	}

	// ========== 进度上报 ==========

	/** 开始进度上报 */
	function startProgressReport(): void {
		if (progressTimer) {
			clearInterval(progressTimer);
		}

		progressTimer = setInterval(() => {
			if (videoEl && !videoEl.paused && !isDestroyed) {
				callbacks?.onTimeUpdate?.(videoEl.currentTime, videoEl.duration || 0);
			}
		}, PLAYER_CONFIG.PROGRESS_REPORT_INTERVAL * 1000);
	}

	// ========== 控制栏显示/隐藏 ==========

	/** 显示控制栏 */
	function showControlsHandler(): void {
		showControls = true;

		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
		}

		hideControlsTimer = setTimeout(() => {
			if (isPlaying && !isDestroyed) {
				showControls = false;
			}
		}, 3000);
	}

	// ========== 生命周期 ==========

	/** 监听 playLines 变化，自动初始化播放器 */
	$effect(() => {
		if (playLines.length > 0 && videoEl) {
			currentLineIndex = 0;
			retryCount = 0;
			initPlayer(0);
		}

		return () => {
			destroyPlayer();
		};
	});

	/** 监听全屏变化 */
	$effect(() => {
		const handler = () => {
			isFullscreen = !!document.fullscreenElement;
		};

		document.addEventListener('fullscreenchange', handler);

		return () => {
			document.removeEventListener('fullscreenchange', handler);
		};
	});

	onMount(() => {
		// 设置初始音量
		if (videoEl) {
			videoEl.volume = volume;
		}

		// 连接弹幕 WebSocket
		connectDanmakuWS();
	});

	onDestroy(() => {
		isDestroyed = true;
		destroyPlayer();

		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
		}
		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		// 断开弹幕 WebSocket 连接
		disconnectDanmakuWS();
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="relative w-full bg-black rounded-lg overflow-hidden select-none"
	class:fullscreen-container={isFullscreen}
	onmousemove={showControlsHandler}
	onclick={showControlsHandler}
	role="application"
	aria-label="视频播放器"
>
	<!-- 视频元素 -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={videoEl}
		class="w-full aspect-video object-contain"
		{poster}
		playsinline
		onplay={() => {
			isPlaying = true;
			playerState = 'playing';
			startProgressReport();
			connectDanmakuWS();
			callbacks?.onPlay?.();
		}}
		onpause={() => {
			isPlaying = false;
			playerState = 'paused';
			disconnectDanmakuWS();
			callbacks?.onPause?.();
		}}
		onwaiting={() => { isLoading = true; }}
		oncanplay={() => { isLoading = false; }}
		onended={() => {
			isPlaying = false;
			playerState = 'idle';
			callbacks?.onEnded?.();
		}}
		onerror={handleVideoError}
	></video>

	<!-- 错误提示 -->
	{#if playerState === 'error'}
		<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
			<svg class="w-12 h-12 text-white/60 mb-3" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
			</svg>
			<p class="text-white/80 text-sm mb-2">{errorMessage}</p>
			{#if playLines.length > 1}
				<p class="text-white/50 text-xs mb-4">已尝试 {playLines.length} 条线路</p>
			{/if}
			<button
				onclick={retryPlay}
				class="px-4 py-2 text-white rounded-full text-sm btn-press"
				style="background-color: #FB7299;"
			>
				重新加载
			</button>
		</div>
	{/if}

	<!-- 线路切换中提示 -->
	{#if playerState === 'switching' && playerState !== 'error'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
			<div class="text-center">
				<div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
				<p class="text-white/80 text-xs">正在切换线路...</p>
			</div>
		</div>
	{/if}

	<!-- 加载中 -->
	{#if isLoading && playerState !== 'error' && playerState !== 'switching'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
			<div class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
		</div>
	{/if}

	<!-- 播放/暂停按钮（中央） -->
	{#if !isPlaying && !isLoading && playerState !== 'error' && playerState !== 'switching'}
		<button
			onclick={togglePlay}
			class="absolute inset-0 flex items-center justify-center z-10"
			aria-label={isPlaying ? '暂停' : '播放'}
		>
			<div class="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center btn-press">
				<svg class="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
		</button>
	{/if}

	<!-- 切线 Toast 提示 -->
	{#if showLineSwitchToast}
		<div class="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
			<div
				class="px-4 py-2 rounded-lg text-white text-xs shadow-lg backdrop-blur-sm"
				style="background-color: rgba(251, 114, 153, 0.9);"
			>
				{lineSwitchMessage}
			</div>
		</div>
	{/if}

	<!-- 控制栏 -->
	{#if showControls && playerState !== 'error'}
		<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 z-10">
			<!-- 进度条 -->
			<button
				class="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-2 relative group block"
				onclick={seek}
				aria-label="进度条"
				onkeydown={(e) => e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? seek(e as unknown as MouseEvent) : null}
			>
				<!-- 缓冲进度 -->
				<div class="absolute top-0 left-0 h-full bg-white/30 rounded-full" style="width: {bufferedPercent}%"></div>
				<!-- 播放进度 -->
				<div class="absolute top-0 left-0 h-full rounded-full" style="width: {progressPercent}%; background-color: #FB7299;"></div>
				<!-- 进度点 -->
				<div
					class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
					style="left: {progressPercent}%; background-color: #FB7299;"
				></div>
			</button>

			<!-- 控制按钮 -->
			<div class="flex items-center justify-between text-white text-xs">
				<div class="flex items-center gap-3">
					<!-- 播放/暂停 -->
					<button onclick={togglePlay} class="btn-press" aria-label={isPlaying ? '暂停' : '播放'}>
						{#if isPlaying}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
							</svg>
						{:else}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8 5v14l11-7z"/>
							</svg>
						{/if}
					</button>

					<!-- 时间 -->
					<span>{formattedCurrentTime} / {formattedDuration}</span>
				</div>

				<div class="flex items-center gap-3">
					<!-- 当前线路名称 -->
					{#if currentLine}
						<span class="text-[10px] text-white/60 hidden sm:inline">
							{currentLine.source_name}
						</span>
					{/if}

					<!-- 在线人数 -->
					{#if onlineCount > 0}
						<span class="text-[10px] text-white/60 hidden sm:inline">
							{onlineCount}人在线
						</span>
					{/if}

					<!-- 静音 -->
					<button onclick={toggleMute} class="btn-press" aria-label={isMuted ? '取消静音' : '静音'}>
						{#if isMuted}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
							</svg>
						{:else}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
							</svg>
						{/if}
					</button>

					<!-- 全屏 -->
					<button onclick={toggleFullscreen} class="btn-press" aria-label={isFullscreen ? '退出全屏' : '全屏'}>
						{#if isFullscreen}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
							</svg>
						{:else}
							<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
