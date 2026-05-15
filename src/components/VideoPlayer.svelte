<script lang="ts">
	/**
	 * hls.js 视频播放器组件
	 * 支持播放/暂停、进度条、全屏、自动播放、错误重试、进度上报
	 */
	import { onMount } from 'svelte';
	import Hls from 'hls.js';
	import { decryptPlayUrl } from '$lib/crypto';
	import { formatDuration } from '$lib/utils';
	import { PLAYER_CONFIG } from '$lib/constants';

	interface Props {
		src: string;           // m3u8 地址（可能加密）
		poster?: string;       // 封面图
		autoPlay?: boolean;    // 自动播放
		onTimeUpdate?: (currentTime: number, duration: number) => void;
		onEnded?: () => void;
		onError?: (error: string) => void;
	}

	let {
		src,
		poster = '',
		autoPlay = PLAYER_CONFIG.AUTO_PLAY,
		onTimeUpdate,
		onEnded,
		onError
	}: Props = $props();

	// 播放器状态
	let videoEl: HTMLVideoElement;
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

	// 进度上报定时器
	let progressTimer: ReturnType<typeof setInterval> | null = null;

	// 格式化当前时间和总时长
	const formattedCurrentTime = $derived(formatDuration(currentTime));
	const formattedDuration = $derived(formatDuration(duration));

	// 进度百分比
	const progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
	const bufferedPercent = $derived(duration > 0 ? (buffered / duration) * 100 : 0);

	// 初始化播放器
	function initPlayer() {
		if (!videoEl || !src) return;

		// 销毁旧实例
		destroyPlayer();

		// 解密播放地址
		let playUrl = src;
		if (src.includes('==') || src.includes('/')) {
			// 尝试解密
			try {
				const decrypted = decryptPlayUrl(src);
				if (decrypted.startsWith('http')) {
					playUrl = decrypted;
				}
			} catch {
				// 解密失败，使用原始地址
			}
		}

		isLoading = true;

		if (Hls.isSupported() && playUrl.includes('.m3u8')) {
			// 使用 hls.js 播放 HLS 流
			const hls = new Hls({
				maxBufferLength: PLAYER_CONFIG.MAX_BUFFER_LENGTH,
				maxMaxBufferLength: 60,
				startLevel: -1, // 自动选择质量
				enableWorker: true
			});

			hls.loadSource(playUrl);
			hls.attachMedia(videoEl);

			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				isLoading = false;
				if (autoPlay) {
					videoEl.play().catch(() => {
						// 自动播放被阻止，等待用户交互
						isPlaying = false;
					});
				}
			});

			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							// 网络错误，尝试恢复
							if (retryCount < 3) {
								retryCount++;
								hls.startLoad();
							} else {
								onError?.('网络错误，请检查网络连接');
								destroyPlayer();
							}
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							// 媒体错误，尝试恢复
							hls.recoverMediaError();
							break;
						default:
							onError?.('播放出错，请稍后重试');
							destroyPlayer();
							break;
					}
				}
			});

			hlsInstance = hls;
		} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
			// Safari 原生 HLS 支持
			videoEl.src = playUrl;
			videoEl.addEventListener('loadedmetadata', () => {
				isLoading = false;
				if (autoPlay) {
					videoEl.play().catch(() => {});
				}
			});
		} else {
			// 普通视频格式
			videoEl.src = playUrl;
			videoEl.addEventListener('loadedmetadata', () => {
				isLoading = false;
				if (autoPlay) {
					videoEl.play().catch(() => {});
				}
			});
		}
	}

	// 销毁播放器
	function destroyPlayer() {
		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}
		if (progressTimer) {
			clearInterval(progressTimer);
			progressTimer = null;
		}
	}

	// 播放/暂停
	function togglePlay() {
		if (!videoEl) return;
		if (isPlaying) {
			videoEl.pause();
		} else {
			videoEl.play().catch(() => {});
		}
	}

	// 跳转进度
	function seek(e: MouseEvent) {
		if (!videoEl || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const percent = (e.clientX - rect.left) / rect.width;
		videoEl.currentTime = percent * duration;
	}

	// 全屏切换
	function toggleFullscreen() {
		if (!videoEl) return;
		const container = videoEl.parentElement;
		if (!container) return;

		if (!document.fullscreenElement) {
			container.requestFullscreen().then(() => {
				isFullscreen = true;
			}).catch(() => {});
		} else {
			document.exitFullscreen().then(() => {
				isFullscreen = false;
			}).catch(() => {});
		}
	}

	// 静音切换
	function toggleMute() {
		if (!videoEl) return;
		videoEl.muted = !videoEl.muted;
		isMuted = videoEl.muted;
	}

	// 开始进度上报
	function startProgressReport() {
		if (progressTimer) clearInterval(progressTimer);
		progressTimer = setInterval(() => {
			if (videoEl && !videoEl.paused) {
				onTimeUpdate?.(videoEl.currentTime, videoEl.duration);
			}
		}, PLAYER_CONFIG.PROGRESS_REPORT_INTERVAL * 1000);
	}

	// 监听播放地址变化
	$effect(() => {
		if (src) {
			retryCount = 0;
			initPlayer();
		}
		return () => destroyPlayer();
	});

	// 监听全屏变化
	$effect(() => {
		const handler = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handler);
		return () => document.removeEventListener('fullscreenchange', handler);
	});

	onMount(() => {
		// 自动隐藏控制栏
		let hideTimer: ReturnType<typeof setTimeout>;
		const showControlsHandler = () => {
			showControls = true;
			clearTimeout(hideTimer);
			hideTimer = setTimeout(() => {
				if (isPlaying) showControls = false;
			}, 3000);
		};

		videoEl?.addEventListener('touchstart', showControlsHandler);
		videoEl?.addEventListener('mousemove', showControlsHandler);

		return () => {
			clearTimeout(hideTimer);
		};
	});
</script>

<div class="relative w-full bg-black rounded-lg overflow-hidden select-none" class:fullscreen-container={isFullscreen}>
	<!-- 视频元素 -->
	<video
		bind:this={videoEl}
		class="w-full aspect-video object-contain"
		poster={poster}
		playsinline
		webkit-playsinline
		x5-video-player-type="h5"
		x5-video-player-fullscreen="true"
		onplay={() => { isPlaying = true; startProgressReport(); }}
		onpause={() => { isPlaying = false; }}
		ontimeupdate={() => {
			currentTime = videoEl.currentTime;
			duration = videoEl.duration || 0;
			if (videoEl.buffered.length > 0) {
				buffered = videoEl.buffered.end(videoEl.buffered.length - 1);
			}
		}}
		onended={() => { isPlaying = false; onEnded?.(); }}
		onwaiting={() => { isLoading = true; }}
		oncanplay={() => { isLoading = false; }}
	></video>

	<!-- 加载中 -->
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-black/30">
			<div class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
		</div>
	{/if}

	<!-- 播放/暂停按钮（中央） -->
	{#if !isPlaying && !isLoading}
		<button
			onclick={togglePlay}
			class="absolute inset-0 flex items-center justify-center"
		>
			<div class="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center">
				<svg class="w-7 h-7 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
		</button>
	{/if}

	<!-- 控制栏 -->
	{#if showControls}
		<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300">
			<!-- 进度条 -->
			<div
				class="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-2 relative group"
				onclick={seek}
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
			</div>

			<!-- 控制按钮 -->
			<div class="flex items-center justify-between text-white text-xs">
				<div class="flex items-center gap-3">
					<!-- 播放/暂停 -->
					<button onclick={togglePlay} class="btn-press">
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
					<button onclick={toggleMute} class="btn-press">
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
					<button onclick={toggleFullscreen} class="btn-press">
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
