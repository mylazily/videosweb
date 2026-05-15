<script lang="ts">
	/**
	 * hls.js 视频播放器组件
	 * 支持播放/暂停、进度条、全屏、自动播放、错误重试、进度上报
	 * 增强：多线路自动切换、播放进度上报、错误重试机制、播放器事件回调
	 * 增强：集成 WebSocket 弹幕连接，播放时自动连接，暂停/停止时断开
	 */
	import { onMount, onDestroy } from 'svelte';
	import Hls from 'hls.js';
	import { decryptPlayUrl } from '$lib/crypto';
	import { formatDuration } from '$lib/utils';
	import { PLAYER_CONFIG } from '$lib/constants';
	import type { PlayerCallbacks } from '$lib/types';
	import { getDanmakuWS } from '$lib/danmaku/websocket';
	import type { DanmakuWS } from '$lib/danmaku/websocket';

	interface Props {
		src: string;           // m3u8 地址（可能加密）
		poster?: string;       // 封面图
		autoPlay?: boolean;    // 自动播放
		sources?: string[];    // 多线路播放地址列表（用于自动切换）
		videoId?: string;      // 视频 ID（用于弹幕 WebSocket）
		onTimeUpdate?: (currentTime: number, duration: number) => void;
		onEnded?: () => void;
		onError?: (error: string) => void;
		onPlay?: () => void;
		onPause?: () => void;
	}

	let {
		src,
		poster = '',
		autoPlay = PLAYER_CONFIG.AUTO_PLAY,
		sources = [],
		videoId = '',
		onTimeUpdate,
		onEnded,
		onError,
		onPlay,
		onPause
	}: Props = $props();

	// ========== 播放器状态 ==========
	let videoEl: HTMLVideoElement | null = $state(null);
	let hlsInstance: Hls | null = $state(null);
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let buffered = $state(0);
	let volume = $state(PLAYER_CONFIG.DEFAULT_VOLUME);
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let isLoading = $state(false);
	let showControls = $state(true);
	let retryCount = $state(0);
	let hasError = $state(false);
	let errorMessage = $state('');
	let currentSourceIndex = $state(0); // 当前线路索引
	let isSwitchingSource = $state(false); // 正在切换线路
	const MAX_RETRY = 3; // 最大重试次数

	// 所有可用线路（主线路 + 备用线路）
	const allSources = $derived(
		sources.length > 0 ? sources : [src]
	);
	const currentSource = $derived(allSources[currentSourceIndex] || src);

	// ========== 定时器和引用 ==========
	let progressTimer: ReturnType<typeof setInterval> | null = null;
	let hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
	let isDestroyed = false;

	// ========== WebSocket 弹幕连接 ==========

	let danmakuWS: DanmakuWS | null = null;

	/**
	 * 连接弹幕 WebSocket
	 */
	function connectDanmakuWS(): void {
		if (!videoId) return;

		danmakuWS = getDanmakuWS();
		danmakuWS.connect(videoId);
	}

	/**
	 * 断开弹幕 WebSocket
	 */
	function disconnectDanmakuWS(): void {
		if (danmakuWS) {
			danmakuWS.disconnect();
			danmakuWS = null;
		}
	}

	// ========== 派生状态 ==========
	const formattedCurrentTime = $derived(formatDuration(currentTime));
	const formattedDuration = $derived(formatDuration(duration));
	const progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
	const bufferedPercent = $derived(duration > 0 ? (buffered / duration) * 100 : 0);

	// ========== 播放器初始化和销毁 ==========

	/**
	 * 初始化播放器
	 */
	function initPlayer(): void {
		if (!videoEl || isDestroyed) return;

		// 使用当前线路地址
		const currentSrc = allSources[currentSourceIndex] || src;
		if (!currentSrc) return;

		// 清理旧实例
		destroyPlayer();

		// 重置错误状态
		hasError = false;
		errorMessage = '';

		// 解密播放地址
		let playUrl = currentSrc;
		if (currentSrc.includes('==') || currentSrc.includes('/')) {
			try {
				const decrypted = decryptPlayUrl(currentSrc);
				if (decrypted.startsWith('http')) {
					playUrl = decrypted;
				}
			} catch {
				// 解密失败，使用原始地址
			}
		}

		isLoading = true;

		try {
			if (Hls.isSupported() && playUrl.includes('.m3u8')) {
				initHlsPlayer(playUrl);
			} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
				initNativeHlsPlayer(playUrl);
			} else {
				initStandardPlayer(playUrl);
			}
		} catch (error) {
			handlePlayerErrorWithRetry('播放器初始化失败');
		}
	}

	/**
	 * 初始化 hls.js 播放器
	 */
	function initHlsPlayer(playUrl: string): void {
		if (!videoEl) return;

		const hls = new Hls({
			maxBufferLength: PLAYER_CONFIG.MAX_BUFFER_LENGTH,
			maxMaxBufferLength: 60,
			startLevel: -1,
			enableWorker: true,
			// 添加错误恢复配置
			fragLoadingMaxRetry: 3,
			manifestLoadingMaxRetry: 3,
			levelLoadingMaxRetry: 3
		});

		hls.loadSource(playUrl);
		hls.attachMedia(videoEl);

		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			if (isDestroyed) return;
			isLoading = false;
			if (autoPlay) {
				videoEl?.play().catch(() => {
					isPlaying = false;
				});
			}
		});

		hls.on(Hls.Events.ERROR, (_event, data) => {
			if (isDestroyed) return;

			if (data.fatal) {
				switch (data.type) {
					case Hls.ErrorTypes.NETWORK_ERROR:
						if (retryCount < MAX_RETRY) {
							retryCount++;
							hls.startLoad();
						} else {
							handlePlayerErrorWithRetry('网络错误，请检查网络连接');
						}
						break;
					case Hls.ErrorTypes.MEDIA_ERROR:
						hls.recoverMediaError();
						break;
					default:
						handlePlayerErrorWithRetry('播放出错，请稍后重试');
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
		if (!videoEl) return;

		videoEl.src = playUrl;
		videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
		videoEl.addEventListener('error', handleVideoError);
	}

	/**
	 * 初始化标准视频播放器
	 */
	function initStandardPlayer(playUrl: string): void {
		if (!videoEl) return;

		videoEl.src = playUrl;
		videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
		videoEl.addEventListener('error', handleVideoError);
	}

	/**
	 * 处理元数据加载完成
	 */
	function handleLoadedMetadata(): void {
		if (isDestroyed) return;
		isLoading = false;
		if (autoPlay) {
			videoEl?.play().catch(() => {});
		}
	}

	/**
	 * 处理视频错误
	 */
	function handleVideoError(): void {
		if (isDestroyed) return;
		handlePlayerErrorWithRetry('视频加载失败');
	}

	/**
	 * 带自动切换线路的错误处理
	 * 当前线路重试 MAX_RETRY 次后，自动切换到下一条线路
	 */
	function handlePlayerErrorWithRetry(message: string): void {
		// 尝试切换到下一条线路
		if (allSources.length > 1 && currentSourceIndex < allSources.length - 1) {
			currentSourceIndex++;
			retryCount = 0;
			isSwitchingSource = true;
			console.log(`[播放器] 切换到线路 ${currentSourceIndex + 1}/${allSources.length}`);
			// 延迟切换，给用户提示
			setTimeout(() => {
				isSwitchingSource = false;
				initPlayer();
			}, 500);
			return;
		}

		// 所有线路都失败
		hasError = true;
		errorMessage = allSources.length > 1
			? `${message}（已尝试 ${allSources.length} 条线路）`
			: message;
		isLoading = false;
		onError?.(errorMessage);
		destroyPlayer();
	}

	/**
	 * 处理播放器错误（不自动切换）
	 */
	function handlePlayerError(message: string): void {
		hasError = true;
		errorMessage = message;
		isLoading = false;
		onError?.(message);
		destroyPlayer();
	}

	/**
	 * 销毁播放器
	 */
	function destroyPlayer(): void {
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

	/**
	 * 播放/暂停切换
	 */
	function togglePlay(): void {
		if (!videoEl || hasError) return;

		if (isPlaying) {
			videoEl.pause();
		} else {
			videoEl.play().catch(() => {});
		}
	}

	/**
	 * 跳转进度
	 */
	function seek(e: MouseEvent): void {
		if (!videoEl || !duration || hasError) return;

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const percent = (e.clientX - rect.left) / rect.width;
		const newTime = percent * duration;

		videoEl.currentTime = newTime;
		currentTime = newTime;
	}

	/**
	 * 全屏切换
	 */
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

	/**
	 * 静音切换
	 */
	function toggleMute(): void {
		if (!videoEl) return;

		videoEl.muted = !videoEl.muted;
		isMuted = videoEl.muted;
	}

	/**
	 * 重试播放（重置所有线路）
	 */
	function retryPlay(): void {
		currentSourceIndex = 0;
		retryCount = 0;
		hasError = false;
		errorMessage = '';
		initPlayer();
	}

	// ========== 进度上报 ==========

	/**
	 * 开始进度上报
	 */
	function startProgressReport(): void {
		if (progressTimer) {
			clearInterval(progressTimer);
		}

		progressTimer = setInterval(() => {
			if (videoEl && !videoEl.paused && !isDestroyed) {
				onTimeUpdate?.(videoEl.currentTime, videoEl.duration || 0);
			}
		}, PLAYER_CONFIG.PROGRESS_REPORT_INTERVAL * 1000);
	}

	// ========== 控制栏显示/隐藏 ==========

	/**
	 * 显示控制栏
	 */
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

	/**
	 * 监听播放地址变化
	 */
	$effect(() => {
		if (src) {
			retryCount = 0;
			initPlayer();
		}

		return () => {
			destroyPlayer();
		};
	});

	/**
	 * 监听全屏变化
	 */
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
	});

	onDestroy(() => {
		isDestroyed = true;
		destroyPlayer();

		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
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
		onplay={() => { isPlaying = true; startProgressReport(); connectDanmakuWS(); onPlay?.(); }}
		onpause={() => { isPlaying = false; disconnectDanmakuWS(); onPause?.(); }}
		onwaiting={() => { isLoading = true; }}
		oncanplay={() => { isLoading = false; }}
		onended={() => { isPlaying = false; onEnded?.(); }}
		onerror={handleVideoError}
	></video>

	<!-- 错误提示 -->
	{#if hasError}
		<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
			<svg class="w-12 h-12 text-white/60 mb-3" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</svg>
			<p class="text-white/80 text-sm mb-2">{errorMessage}</p>
			{#if allSources.length > 1}
				<p class="text-white/50 text-xs mb-4">已尝试 {allSources.length} 条线路</p>
			{/if}
			<button
				onclick={retryPlay}
				class="px-4 py-2 bg-bilibili text-white rounded-full text-sm btn-press"
			>
				重新加载
			</button>
		</div>
	{/if}

	<!-- 线路切换中提示 -->
	{#if isSwitchingSource && !hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
			<div class="text-center">
				<div class="w-8 h-8 border-2 border-bilibili/30 border-t-bilibili rounded-full animate-spin mx-auto mb-2"></div>
				<p class="text-white/80 text-xs">正在切换线路 ({currentSourceIndex + 1}/{allSources.length})...</p>
			</div>
		</div>
	{/if}

	<!-- 加载中 -->
	{#if isLoading && !hasError}
		<div class="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
			<div class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
		</div>
	{/if}

	<!-- 播放/暂停按钮（中央） -->
	{#if !isPlaying && !isLoading && !hasError}
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

	<!-- 控制栏 -->
	{#if showControls && !hasError}
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
				<div class="absolute top-0 left-0 h-full bg-bilibili rounded-full" style="width: {progressPercent}%"></div>
				<!-- 进度点 -->
				<div
					class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-bilibili rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
					style="left: {progressPercent}%"
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
