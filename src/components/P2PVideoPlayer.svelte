<script lang="ts">
	/**
	 * P2P HLS 视频播放器组件
	 * 基于 p2p-media-loader-hlsjs + hls.js
	 * 核心功能：
	 * - P2P 边下载边分享，同一视频的用户自动组网
	 * - 多线路容灾切换（继承 VideoPlayer 逻辑）
	 * - 缓冲区动态优化（根据下载速率调整预加载策略）
	 * - P2P 不可用时自动降级到纯 HTTP 模式
	 * - Svelte 5 runes ($state, $effect, $props, $derived)
	 * - SSR 安全（动态导入）
	 */
	import { onMount, onDestroy, browser } from 'svelte';
	import { decryptPlayUrl } from '$lib/crypto';
	import { formatDuration } from '$lib/utils';
	import { PLAYER_CONFIG, P2P_CONFIG } from '$lib/constants';
	import type { PlayLine, PlayerState, P2PStats } from '$lib/types';
	import P2PStatsPanel from './P2PStatsPanel.svelte';

	// ========== 类型声明（动态导入用） ==========

	type HlsType = import('hls.js').default;
	type P2PMediaLoaderModule = typeof import('p2p-media-loader-hlsjs');

	// ========== Props ==========

	interface Props {
		playLines: PlayLine[];
		domainPool?: string[];
		sharedPath?: string;
		videoId: string;
		autoPlay?: boolean;
		startTime?: number;
		onLineChange?: (index: number) => void;
		onTimeUpdate?: (time: number) => void;
	}

	let {
		playLines = [],
		domainPool = [],
		sharedPath = '',
		videoId = '',
		autoPlay = PLAYER_CONFIG.AUTO_PLAY,
		startTime = 0,
		onLineChange,
		onTimeUpdate
	}: Props = $props();

	// ========== 播放器状态 ==========

	let videoEl: HTMLVideoElement | null = $state(null);
	let currentLineIndex = $state(0);
	let playerState = $state<PlayerState>('idle');
	let errorMessage = $state('');
	let retryCount = $state(0);
	let lastPlayTime = $state(0);
	let isLoading = $state(false);
	let showLineSwitchToast = $state(false);
	let lineSwitchMessage = $state('');

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

	// P2P 相关状态
	let p2pStats = $state<P2PStats>({
		p2pDownloaded: 0,
		httpDownloaded: 0,
		p2pPeers: 0,
		p2pSpeed: 0,
		httpSpeed: 0,
		bufferLength: 0,
		isP2PAvailable: false
	});
	let isP2PLoading = $state(false); // P2P 库加载中
	let isP2PFailed = $state(false);  // P2P 不可用，已降级

	// 缓冲区优化状态
	let isLowSpeed = $state(false); // 是否处于低速模式

	// 定时器和引用
	let progressTimer: ReturnType<typeof setInterval> | null = null;
	let hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
	let loadTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let statsTimer: ReturnType<typeof setInterval> | null = null;
	let bufferOptimizeTimer: ReturnType<typeof setInterval> | null = null;
	let isDestroyed = false;

	// 内部实例引用（不使用 $state，避免不必要的响应式开销）
	let hlsInstance: HlsType | null = null;
	let p2pEngine: unknown = null;

	// 容灾常量
	const MAX_RETRY_PER_LINE = 2;
	const LOAD_TIMEOUT_MS = 6000;
	const TOAST_DURATION_MS = 3000;

	// ========== 派生状态 ==========

	const currentLine = $derived(playLines[currentLineIndex] || null);
	const formattedCurrentTime = $derived(formatDuration(currentTime));
	const formattedDuration = $derived(formatDuration(duration));
	const progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
	const bufferedPercent = $derived(duration > 0 ? (buffered / duration) * 100 : 0);

	// ========== Toast 提示 ==========

	function showToast(message: string): void {
		lineSwitchMessage = message;
		showLineSwitchToast = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { showLineSwitchToast = false; }, TOAST_DURATION_MS);
	}

	// ========== 动态导入 P2P 和 HLS 库 ==========

	/**
	 * 动态导入 hls.js 和 p2p-media-loader-hlsjs（SSR 安全）
	 * @returns Hls 类和 initP2PLoader 函数
	 */
	async function loadLibraries(): Promise<{
		Hls: HlsType;
		initP2PLoader: (p2pModule: P2PMediaLoaderModule) => unknown;
		p2pModule: P2PMediaLoaderModule | null;
	} | null> {
		if (!browser) return null;

		try {
			// 动态导入 hls.js
			const hlsModule = await import('hls.js');
			const Hls = hlsModule.default as HlsType;

			// 尝试动态导入 p2p-media-loader-hlsjs
			let p2pModule: P2PMediaLoaderModule | null = null;
			let initP2PLoader: ((m: P2PMediaLoaderModule) => unknown) | null = null;

			try {
				p2pModule = await import('p2p-media-loader-hlsjs') as P2PMediaLoaderModule;
				if (p2pModule && typeof p2pModule.initP2PLoader === 'function') {
					initP2PLoader = p2pModule.initP2PLoader.bind(p2pModule);
				}
			} catch (p2pErr) {
				console.warn('[P2P播放器] p2p-media-loader-hlsjs 加载失败，将使用纯 HTTP 模式:', p2pErr);
				isP2PFailed = true;
			}

			return {
				Hls,
				initP2PLoader: initP2PLoader || (() => null),
				p2pModule
			};
		} catch (err) {
			console.error('[P2P播放器] hls.js 加载失败:', err);
			return null;
		}
	}

	// ========== P2P 引擎管理 ==========

	/**
	 * 创建 P2P 引擎
	 * 基于 m3u8 URL 生成 Swarm ID，同一视频的用户自动组网
	 */
	function createP2PEngine(
		initP2PLoader: (m: unknown) => unknown,
		p2pModule: unknown,
		m3u8Url: string
	): unknown {
		try {
			// 生成 Swarm ID：基于 m3u8 URL 的哈希
			const swarmId = generateSwarmId(m3u8Url);

			const engine = initP2PLoader(p2pModule);

			// 如果引擎有配置方法
			if (engine && typeof engine === 'object') {
				const eng = engine as Record<string, unknown>;
				if (typeof eng.setConfig === 'function') {
					(eng.setConfig as Function)({
						simultaneousHttpDownloads: P2P_CONFIG.SIMULTANEOUS_HTTP_DOWNLOADS,
						httpDownloadTimeout: P2P_CONFIG.HTTP_DOWNLOAD_TIMEOUT,
						useP2P: true,
						trackerAnnounceSwarmId: swarmId
					});
				}
			}

			console.log(`[P2P播放器] P2P 引擎已创建，Swarm ID: ${swarmId}`);
			return engine;
		} catch (err) {
			console.warn('[P2P播放器] P2P 引擎创建失败，降级到纯 HTTP:', err);
			isP2PFailed = true;
			return null;
		}
	}

	/**
	 * 销毁 P2P 引擎
	 */
	function destroyP2PEngine(): void {
		if (p2pEngine) {
			try {
				if (typeof p2pEngine === 'object' && p2pEngine !== null) {
					const eng = p2pEngine as Record<string, unknown>;
					if (typeof eng.destroy === 'function') {
						(eng.destroy as Function)();
					}
				}
			} catch {
				// 忽略销毁错误
			}
			p2pEngine = null;
		}
	}

	/**
	 * 基于 m3u8 URL 生成 Swarm ID
	 * 同一视频的 URL 会生成相同的 Swarm ID
	 */
	function generateSwarmId(m3u8Url: string): string {
		// 简单哈希：取 URL 的路径部分作为 Swarm ID
		try {
			const url = new URL(m3u8Url);
			// 去掉文件名中的查询参数和随机 token，保留路径结构
			const path = url.pathname;
			return `xvideos-p2p-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;
		} catch {
			// URL 解析失败时使用原始 URL 的简单哈希
			return `xvideos-p2p-${m3u8Url.slice(0, 64).replace(/[^a-zA-Z0-9]/g, '-')}`;
		}
	}

	// ========== P2P 统计更新 ==========

	/**
	 * 从 P2P 引擎收集统计数据
	 */
	function updateP2PStats(): void {
		if (!p2pEngine || typeof p2pEngine !== 'object' || p2pEngine === null) return;

		try {
			const eng = p2pEngine as Record<string, unknown>;

			// 获取 P2P 统计
			if (typeof eng.getStats === 'function') {
				const stats = (eng.getStats as Function)();
				if (stats) {
					const prevP2PDownloaded = p2pStats.p2pDownloaded;
					const prevHttpDownloaded = p2pStats.httpDownloaded;

					p2pStats = {
						p2pDownloaded: stats.p2pDownloaded ?? 0,
						httpDownloaded: stats.httpDownloaded ?? 0,
						p2pPeers: stats.peers ?? 0,
						p2pSpeed: (stats.p2pDownloaded ?? 0) - prevP2PDownloaded,
						httpSpeed: (stats.httpDownloaded ?? 0) - prevHttpDownloaded,
						bufferLength: videoEl ? getBufferLength() : 0,
						isP2PAvailable: true
					};
					return;
				}
			}

			// 备用：从 HLS 实例获取缓冲区信息
			p2pStats = {
				...p2pStats,
				bufferLength: videoEl ? getBufferLength() : 0,
				p2pSpeed: 0,
				httpSpeed: 0
			};
		} catch {
			// 统计获取失败，保持上一次数据
		}
	}

	/**
	 * 获取当前缓冲区长度（秒）
	 */
	function getBufferLength(): number {
		if (!videoEl) return 0;
		try {
			const buf = videoEl.buffered;
			if (buf.length === 0) return 0;
			return buf.end(buf.length - 1) - videoEl.currentTime;
		} catch {
			return 0;
		}
	}

	/**
	 * 启动统计定时器
	 */
	function startStatsTimer(): void {
		stopStatsTimer();
		statsTimer = setInterval(() => {
			if (!isDestroyed) {
				updateP2PStats();
			}
		}, P2P_CONFIG.STATS_UPDATE_INTERVAL);
	}

	function stopStatsTimer(): void {
		if (statsTimer) {
			clearInterval(statsTimer);
			statsTimer = null;
		}
	}

	// ========== 缓冲区动态优化 ==========

	/**
	 * 根据下载速率动态调整缓冲区预加载策略
	 * - 低速 (< 100KB/s)：降低预加载阈值，减少资源站压力
	 * - 高速 (> 500KB/s)：恢复正常预加载
	 */
	function startBufferOptimize(): void {
		stopBufferOptimize();
		bufferOptimizeTimer = setInterval(() => {
			if (isDestroyed || !hlsInstance) return;

			const totalSpeed = p2pStats.p2pSpeed + p2pStats.httpSpeed;

			if (totalSpeed < P2P_CONFIG.LOW_SPEED_THRESHOLD && !isLowSpeed) {
				// 进入低速模式
				isLowSpeed = true;
				adjustBufferConfig(P2P_CONFIG.LOW_SPEED_BUFFER_LENGTH, P2P_CONFIG.LOW_SPEED_MAX_BUFFER_LENGTH);
				console.log('[P2P播放器] 检测到低速，降低预加载阈值');
			} else if (totalSpeed > P2P_CONFIG.HIGH_SPEED_THRESHOLD && isLowSpeed) {
				// 恢复正常模式
				isLowSpeed = false;
				adjustBufferConfig(P2P_CONFIG.MAX_BUFFER_LENGTH, P2P_CONFIG.MAX_MAX_BUFFER_LENGTH);
				console.log('[P2P播放器] 速率恢复正常，恢复预加载');
			}
		}, P2P_CONFIG.BUFFER_OPTIMIZE_INTERVAL);
	}

	function stopBufferOptimize(): void {
		if (bufferOptimizeTimer) {
			clearInterval(bufferOptimizeTimer);
			bufferOptimizeTimer = null;
		}
	}

	/**
	 * 动态调整 HLS 缓冲区配置
	 */
	function adjustBufferConfig(maxBufferLength: number, maxMaxBufferLength: number): void {
		if (!hlsInstance) return;
		try {
			const hls = hlsInstance as Record<string, unknown>;
			if (typeof hls.config === 'object' && hls.config !== null) {
				const config = hls.config as Record<string, unknown>;
				config.maxBufferLength = maxBufferLength;
				config.maxMaxBufferLength = maxMaxBufferLength;
			}
		} catch {
			// 配置调整失败，忽略
		}
	}

	// ========== 播放器初始化和销毁 ==========

	/**
	 * 初始化/切换播放器
	 */
	async function initPlayer(lineIndex: number): Promise<void> {
		if (!videoEl || isDestroyed) return;

		const line = playLines[lineIndex];
		if (!line) return;

		// 销毁旧播放器和 P2P 引擎
		destroyPlayer();

		// 重置状态
		errorMessage = '';
		playerState = 'loading';
		isLoading = true;
		isP2PLoading = true;

		// 获取 m3u8 URL
		let playUrl = line.m3u8_url;

		// 如果需要 XOR 解密
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

		// 加载超时
		loadTimeoutTimer = setTimeout(() => {
			if (playerState === 'loading') {
				console.warn('[P2P播放器] 加载超时，触发容灾切换');
				handleNetworkError();
			}
		}, LOAD_TIMEOUT_MS);

		// 动态加载库
		const libs = await loadLibraries();
		isP2PLoading = false;

		if (!libs) {
			clearLoadTimeout();
			playerState = 'error';
			isLoading = false;
			errorMessage = '播放器组件加载失败，请刷新页面重试';
			return;
		}

		const { Hls, initP2PLoader, p2pModule } = libs;

		try {
			if (Hls.isSupported() && playUrl.includes('.m3u8')) {
				await initP2PHlsPlayer(Hls, initP2PLoader, p2pModule, playUrl);
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
	 * 初始化 P2P HLS 播放器
	 */
	async function initP2PHlsPlayer(
		Hls: HlsType,
		initP2PLoader: (m: unknown) => unknown,
		p2pModule: unknown,
		playUrl: string
	): Promise<void> {
		if (!videoEl || isDestroyed) return;

		// 创建 P2P 引擎
		if (p2pModule && !isP2PFailed) {
			p2pEngine = createP2PEngine(initP2PLoader, p2pModule, playUrl);
		}

		// 创建 HLS 实例
		const hls = new Hls({
			maxBufferLength: isLowSpeed ? P2P_CONFIG.LOW_SPEED_BUFFER_LENGTH : P2P_CONFIG.MAX_BUFFER_LENGTH,
			maxMaxBufferLength: isLowSpeed ? P2P_CONFIG.LOW_SPEED_MAX_BUFFER_LENGTH : P2P_CONFIG.MAX_MAX_BUFFER_LENGTH,
			maxBufferHole: P2P_CONFIG.MAX_BUFFER_HOLE,
			backBufferLength: P2P_CONFIG.BACK_BUFFER_LENGTH,
			lowLatencyMode: false,
			startLevel: -1,
			enableWorker: true,
			fragLoadingMaxRetry: 2,
			manifestLoadingMaxRetry: 2,
			levelLoadingMaxRetry: 2
		});

		// 如果 P2P 引擎创建成功，尝试集成
		if (p2pEngine && typeof p2pEngine === 'object') {
			try {
				const eng = p2pEngine as Record<string, unknown>;
				if (typeof eng.attachHls === 'function') {
					(eng.attachHls as Function)(hls);
				}
			} catch {
				console.warn('[P2P播放器] P2P 引擎附加到 HLS 失败，使用纯 HTTP');
				isP2PFailed = true;
			}
		}

		hls.loadSource(playUrl);
		hls.attachMedia(videoEl);

		// m3u8 清单解析成功
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			if (isDestroyed) return;
			clearLoadTimeout();
			playerState = 'playing';
			isLoading = false;
			p2pStats.isP2PAvailable = !isP2PFailed;

			recoverProgress();

			if (autoPlay) {
				videoEl?.play().catch(() => {
					isPlaying = false;
					playerState = 'paused';
				});
			}

			// 启动统计和缓冲优化
			startStatsTimer();
			startBufferOptimize();
		});

		// 切片加载成功
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

	function handleLoadedMetadata(): void {
		if (isDestroyed) return;
		clearLoadTimeout();
		playerState = 'playing';
		isLoading = false;

		recoverProgress();

		if (autoPlay) {
			videoEl?.play().catch(() => {});
		}

		startStatsTimer();
	}

	function handleVideoError(): void {
		if (isDestroyed) return;
		clearLoadTimeout();
		handleNetworkError();
	}

	// ========== 容灾逻辑 ==========

	/**
	 * 网络错误处理（核心容灾逻辑）
	 */
	function handleNetworkError(): void {
		if (isDestroyed) return;

		retryCount++;

		if (retryCount <= MAX_RETRY_PER_LINE) {
			console.log(`[P2P播放器] 重试当前线路 (${retryCount}/${MAX_RETRY_PER_LINE})`);
			showToast(`连接不稳定，正在重试 (${retryCount}/${MAX_RETRY_PER_LINE})...`);
			setTimeout(() => {
				if (!isDestroyed) initPlayer(currentLineIndex);
			}, 1000);
			return;
		}

		// 切换到下一条线路
		const nextLineIndex = currentLineIndex + 1;

		if (nextLineIndex < playLines.length) {
			lastPlayTime = videoEl?.currentTime || 0;
			currentLineIndex = nextLineIndex;
			retryCount = 0;

			const lineName = playLines[nextLineIndex].source_name;
			console.log(`[P2P播放器] 切换到线路 ${nextLineIndex + 1}: ${lineName}`);
			showToast(`当前线路连接超时，已为您切换至 ${lineName}`);

			onLineChange?.(nextLineIndex);

			playerState = 'switching';
			setTimeout(() => {
				if (!isDestroyed) initPlayer(nextLineIndex);
			}, 800);
		} else {
			// 尝试域名池切换
			if (domainPool.length > 0 && sharedPath) {
				handleDomainPoolSwitch();
			} else {
				playerState = 'error';
				isLoading = false;
				errorMessage = '所有采集源在您当前地区均无法连接，请稍后再试';
			}
		}
	}

	/**
	 * 域名池无感切换
	 */
	function handleDomainPoolSwitch(): void {
		if (!sharedPath || domainPool.length === 0) return;

		lastPlayTime = videoEl?.currentTime || 0;
		const nextDomain = domainPool[domainPoolIndex % domainPool.length];
		domainPoolIndex++;

		const newUrl = `${nextDomain}${sharedPath}`;
		console.log(`[P2P播放器] 域名池切换: ${nextDomain}`);
		showToast('正在切换备用节点...');

		playerState = 'switching';
		destroyPlayer();

		setTimeout(async () => {
			if (!isDestroyed && videoEl) {
				errorMessage = '';
				isLoading = true;
				isP2PLoading = true;

				loadTimeoutTimer = setTimeout(() => {
					if (playerState === 'loading' || playerState === 'switching') {
						playerState = 'error';
						isLoading = false;
						isP2PLoading = false;
						errorMessage = '所有采集源在您当前地区均无法连接，请稍后再试';
					}
				}, LOAD_TIMEOUT_MS);

				const libs = await loadLibraries();
				isP2PLoading = false;

				if (!libs) {
					playerState = 'error';
					isLoading = false;
					errorMessage = '播放器组件加载失败';
					return;
				}

				const { Hls, initP2PLoader, p2pModule } = libs;

				try {
					if (Hls.isSupported()) {
						await initP2PHlsPlayer(Hls, initP2PLoader, p2pModule, newUrl);
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
	 */
	function recoverProgress(): void {
		if (!videoEl || lastPlayTime <= 0) return;
		try {
			videoEl.currentTime = lastPlayTime;
			console.log(`[P2P播放器] 恢复播放进度: ${lastPlayTime}s`);
		} catch {
			// 进度恢复失败，忽略
		}
	}

	/**
	 * 手动切换线路
	 */
	function switchLine(index: number): void {
		if (index === currentLineIndex || index < 0 || index >= playLines.length) return;

		lastPlayTime = videoEl?.currentTime || 0;
		currentLineIndex = index;
		retryCount = 0;

		const lineName = playLines[index].source_name;
		showToast(`已切换至 ${lineName}`);

		onLineChange?.(index);

		playerState = 'switching';
		setTimeout(() => {
			if (!isDestroyed) initPlayer(index);
		}, 300);
	}

	/**
	 * 清除加载超时
	 */
	function clearLoadTimeout(): void {
		if (loadTimeoutTimer) {
			clearTimeout(loadTimeoutTimer);
			loadTimeoutTimer = null;
		}
	}

	/**
	 * 销毁播放器（防止内存泄漏）
	 * 切换线路时必须销毁旧 P2P 引擎再创建新的
	 */
	function destroyPlayer(): void {
		clearLoadTimeout();
		stopStatsTimer();
		stopBufferOptimize();

		// 清理进度上报
		if (progressTimer) {
			clearInterval(progressTimer);
			progressTimer = null;
		}

		// 销毁 P2P 引擎（必须在 HLS 销毁之前）
		destroyP2PEngine();

		// 销毁 HLS 实例
		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}

		// 清理视频元素
		if (videoEl) {
			videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
			videoEl.removeEventListener('error', handleVideoError);
			videoEl.src = '';
			videoEl.load();
		}

		// 重置 P2P 统计
		p2pStats = {
			p2pDownloaded: 0,
			httpDownloaded: 0,
			p2pPeers: 0,
			p2pSpeed: 0,
			httpSpeed: 0,
			bufferLength: 0,
			isP2PAvailable: false
		};
	}

	// ========== 播放控制 ==========

	function togglePlay(): void {
		if (!videoEl || playerState === 'error') return;
		if (isPlaying) {
			videoEl.pause();
		} else {
			videoEl.play().catch(() => {});
		}
	}

	function seek(e: MouseEvent): void {
		if (!videoEl || !duration || playerState === 'error') return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const percent = (e.clientX - rect.left) / rect.width;
		const newTime = percent * duration;
		videoEl.currentTime = newTime;
		currentTime = newTime;
	}

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

	function toggleMute(): void {
		if (!videoEl) return;
		videoEl.muted = !videoEl.muted;
		isMuted = videoEl.muted;
	}

	function retryPlay(): void {
		currentLineIndex = 0;
		retryCount = 0;
		domainPoolIndex = 0;
		lastPlayTime = 0;
		playerState = 'idle';
		errorMessage = '';
		isP2PFailed = false;
		initPlayer(0);
	}

	// ========== 进度上报 ==========

	function startProgressReport(): void {
		if (progressTimer) clearInterval(progressTimer);
		progressTimer = setInterval(() => {
			if (videoEl && !videoEl.paused && !isDestroyed) {
				onTimeUpdate?.(videoEl.currentTime);
			}
		}, PLAYER_CONFIG.PROGRESS_REPORT_INTERVAL * 1000);
	}

	// ========== 控制栏显示/隐藏 ==========

	function showControlsHandler(): void {
		showControls = true;
		if (hideControlsTimer) clearTimeout(hideControlsTimer);
		hideControlsTimer = setTimeout(() => {
			if (isPlaying && !isDestroyed) showControls = false;
		}, 3000);
	}

	// ========== 生命周期 ==========

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

	$effect(() => {
		const handler = () => { isFullscreen = !!document.fullscreenElement; };
		document.addEventListener('fullscreenchange', handler);
		return () => { document.removeEventListener('fullscreenchange', handler); };
	});

	onMount(() => {
		if (videoEl) {
			videoEl.volume = volume;
		}
	});

	onDestroy(() => {
		isDestroyed = true;
		destroyPlayer();
		if (hideControlsTimer) clearTimeout(hideControlsTimer);
		if (toastTimer) clearTimeout(toastTimer);
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
	aria-label="P2P 视频播放器"
>
	<!-- 视频元素 -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={videoEl}
		class="w-full aspect-video object-contain"
		playsinline
		onplay={() => {
			isPlaying = true;
			playerState = 'playing';
			startProgressReport();
		}}
		onpause={() => {
			isPlaying = false;
			playerState = 'paused';
		}}
		onwaiting={() => { isLoading = true; }}
		oncanplay={() => { isLoading = false; }}
		onended={() => {
			isPlaying = false;
			playerState = 'idle';
		}}
		onerror={handleVideoError}
	></video>

	<!-- P2P 统计悬浮面板 -->
	{#if playerState === 'playing' || playerState === 'paused'}
		<P2PStatsPanel {p2pStats} />
	{/if}

	<!-- 缓冲区状态指示器 -->
	{#if isPlaying && (playerState === 'playing' || playerState === 'paused')}
		<div class="absolute bottom-12 left-2 z-20">
			<div
				class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
				style="background-color: rgba(0, 0, 0, 0.6); color: {isLowSpeed ? '#FFA500' : '#4ADE80'};"
			>
				{#if isLowSpeed}
					<!-- 低速警告 -->
					<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
						<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
					</svg>
				{:else}
					<!-- 正常速度 -->
					<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
					</svg>
				{/if}
				<span>{p2pStats.bufferLength.toFixed(1)}s</span>
			</div>
		</div>
	{/if}

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
				{#if isP2PLoading}
					<p class="text-white/50 text-[10px] mt-1">正在加载 P2P 引擎...</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- 加载中 -->
	{#if isLoading && playerState !== 'error' && playerState !== 'switching'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
			<div class="text-center">
				<div class="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
				{#if isP2PLoading}
					<p class="text-white/60 text-xs mt-2">正在初始化 P2P...</p>
				{/if}
			</div>
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

					<!-- P2P 状态标识 -->
					{#if p2pStats.isP2PAvailable && p2pStats.p2pPeers > 0}
						<span class="text-[10px] text-white/60 hidden sm:inline flex items-center gap-0.5">
							<span class="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
							P2P {p2pStats.p2pPeers}节点
						</span>
					{:else if isP2PFailed}
						<span class="text-[10px] text-white/40 hidden sm:inline">HTTP 模式</span>
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
