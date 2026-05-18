/// <reference lib="webworker" />

/**
 * Service Worker（增强版 v4）
 * 优化：
 * - m3u8/ts 文件的缓存策略（Network First，失败返回缓存）
 * - 播放器页面的离线 fallback
 * - 所有线路失败时的友好离线页面
 * - 定期域名健康检查（后台同步）
 * - P2P 数据缓存、Push 事件监听、通知点击处理
 */

const CACHE_VERSION = 'v4';
const STATIC_CACHE = `xvideos-static-${CACHE_VERSION}`;
const API_CACHE = `xvideos-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `xvideos-images-${CACHE_VERSION}`;
const P2P_CACHE = `xvideos-p2p-${CACHE_VERSION}`;
const MEDIA_CACHE = `xvideos-media-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_URLS = [
	'/',
	'/fallback.html',
	'/offline-player.html',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

// API 请求超时时间
const API_TIMEOUT = 5000;

// 硬编码的备用 API 域名
const FALLBACK_DOMAINS = [
	'https://9901.555554.xyz'
];

// 当前激活的 API 域名
let currentApiDomain = FALLBACK_DOMAINS[0];

// 域名健康状态缓存
const domainHealthCache = new Map();

// ========== 安装事件 ==========

self.addEventListener('install', (event) => {
	console.log('[SW] 安装中...');

	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then((cache) => {
				console.log('[SW] 预缓存静态资源');
				return cache.addAll(PRECACHE_URLS);
			})
			.then(() => self.skipWaiting())
			.catch((err) => {
				console.error('[SW] 预缓存失败:', err);
			})
	);
});

// ========== 激活事件 ==========

self.addEventListener('activate', (event) => {
	console.log('[SW] 激活中...');

	event.waitUntil(
		caches.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => {
							return name.startsWith('xvideos-') &&
								!name.includes(CACHE_VERSION);
						})
						.map((name) => {
							console.log('[SW] 清理旧缓存:', name);
							return caches.delete(name);
						})
				);
			})
			.then(() => self.clients.claim())
			.then(() => {
				// 激活后立即检查 API 域名
				findActiveDomain();
				// 激活后注册后台同步
				registerBackgroundSync();
			})
	);
});

// ========== 工具函数 ==========

/**
 * 带超时的 fetch
 */
function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
	return Promise.race([
		fetch(url, options),
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error('请求超时')), timeout)
		)
	]);
}

/**
 * 检查 API 域名是否可用
 * @returns 延迟时间（毫秒），失败返回 0
 */
async function checkDomain(domain) {
	// 先检查缓存
	if (domainHealthCache.has(domain)) {
		const cached = domainHealthCache.get(domain);
		// 缓存有效期 5 分钟
		if (Date.now() - cached.checkedAt < 5 * 60 * 1000) {
			return cached.latency;
		}
	}

	try {
		const startTime = Date.now();
		const response = await fetchWithTimeout(
			`${domain}/api/v1/health`,
			{ method: 'GET', mode: 'cors' },
			3000
		);
		const latency = response.ok ? Date.now() - startTime : 0;
		domainHealthCache.set(domain, { latency, checkedAt: Date.now() });
		return latency;
	} catch {
		domainHealthCache.set(domain, { latency: 0, checkedAt: Date.now() });
		return 0;
	}
}

/**
 * 探测可用 API 域名（并行探测，返回最快的）
 */
async function findActiveDomain() {
	console.log('[SW] 并行探测可用 API 域名...');

	try {
		// 并行检查所有域名，使用 Promise.allSettled 返回第一个成功的
		const results = await Promise.allSettled(
			FALLBACK_DOMAINS.map(async (domain) => {
				const latency = await checkDomain(domain);
				return { domain, latency, alive: latency > 0 };
			})
		);

		// 找到延迟最低的可用域名
		let bestDomain = FALLBACK_DOMAINS[0];
		let bestLatency = Infinity;

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value.alive) {
				if (result.value.latency < bestLatency) {
					bestLatency = result.value.latency;
					bestDomain = result.value.domain;
				}
			}
		}

		currentApiDomain = bestDomain;
		console.log('[SW] 最优域名:', bestDomain, `(延迟: ${bestLatency}ms)`);

		// 通知所有客户端更新域名
		const clients = await self.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({
				type: 'API_DOMAIN_UPDATE',
				domain: bestDomain
			});
		});

		return bestDomain;
	} catch {
		console.warn('[SW] 域名探测失败，使用默认域名');
		return FALLBACK_DOMAINS[0];
	}
}

/**
 * 注册后台同步
 */
function registerBackgroundSync() {
	if ('sync' in self.registration) {
		self.registration.sync.register('domain-health-check').catch(() => {
			// 后台同步注册失败，不影响主流程
		});
	}
}

/**
 * 判断是否为 API 请求
 */
function isApiRequest(url) {
	return url.pathname.startsWith('/api/');
}

/**
 * 判断是否为 P2P 信令请求
 */
function isP2PRequest(url) {
	return url.pathname.startsWith('/api/v1/p2p/');
}

/**
 * 判断是否为 Push 相关请求
 */
function isPushRequest(url) {
	return url.pathname.startsWith('/api/v1/push/');
}

/**
 * 判断是否为 m3u8 或 ts 媒体文件请求
 */
function isMediaRequest(url) {
	return url.pathname.endsWith('.m3u8') ||
		url.pathname.endsWith('.ts') ||
		url.pathname.endsWith('.m4s') ||
		url.pathname.endsWith('.mp4') ||
		url.pathname.includes('.m3u8?') ||
		url.pathname.includes('/hls/');
}

/**
 * 判断是否为静态资源请求
 */
function isStaticRequest(url) {
	const staticExtensions = [
		'.js', '.css', '.png', '.jpg', '.jpeg', '.gif',
		'.svg', '.webp', '.woff', '.woff2', '.ttf', '.ico'
	];
	return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * 判断是否为图片请求
 */
function isImageRequest(url) {
	const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
	return imageExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * 判断是否为导航请求
 */
function isNavigationRequest(request) {
	return request.mode === 'navigate';
}

/**
 * 判断是否为播放器页面
 */
function isPlayerPage(url) {
	return url.pathname.startsWith('/video/');
}

/**
 * 生成离线播放器页面
 */
function generateOfflinePlayerPage() {
	return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>无法连接 - XVideos 影视</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #17181A;
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			padding: 20px;
		}
		.container {
			text-align: center;
			max-width: 400px;
		}
		.icon {
			width: 80px;
			height: 80px;
			margin: 0 auto 20px;
			background: rgba(251, 114, 153, 0.1);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.icon svg {
			width: 40px;
			height: 40px;
			fill: #FB7299;
		}
		h1 {
			font-size: 20px;
			margin-bottom: 10px;
			color: #fff;
		}
		p {
			font-size: 14px;
			color: #999;
			line-height: 1.6;
			margin-bottom: 24px;
		}
		.btn {
			display: inline-block;
			padding: 12px 32px;
			background: #FB7299;
			color: #fff;
			border: none;
			border-radius: 24px;
			font-size: 14px;
			cursor: pointer;
			text-decoration: none;
			transition: opacity 0.2s;
		}
		.btn:hover { opacity: 0.9; }
		.btn-secondary {
			display: inline-block;
			padding: 10px 24px;
			background: transparent;
			color: #FB7299;
			border: 1px solid #FB7299;
			border-radius: 24px;
			font-size: 13px;
			cursor: pointer;
			text-decoration: none;
			margin-top: 12px;
			transition: opacity 0.2s;
		}
		.btn-secondary:hover { opacity: 0.9; }
	</style>
</head>
<body>
	<div class="container">
		<div class="icon">
			<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
		</div>
		<h1>所有线路暂时无法连接</h1>
		<p>所有采集源在您当前地区均无法连接，请检查网络后重试</p>
		<a href="javascript:void(0)" class="btn" onclick="window.location.reload()">检查网络并重试</a>
		<br>
		<a href="/" class="btn-secondary">返回首页</a>
	</div>
	<script>
		// 尝试检测网络恢复
		window.addEventListener('online', () => {
			window.location.reload();
		});
	</script>
</body>
</html>
	`, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
		status: 503
	});
}

// ========== 缓存策略 ==========

/**
 * 缓存优先策略
 */
async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok) {
			await cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		throw error;
	}
}

/**
 * 网络优先策略
 */
async function networkFirst(request, cacheName, fallbackResponse = null) {
	const cache = await caches.open(cacheName);

	try {
		const response = await fetchWithTimeout(request);

		if (response.ok) {
			// 更新缓存
			await cache.put(request, response.clone());
		}

		return response;
	} catch (error) {
		// 网络失败，尝试返回缓存
		const cached = await cache.match(request);

		if (cached) {
			return cached;
		}

		// 返回备用响应
		if (fallbackResponse) {
			return fallbackResponse;
		}

		throw error;
	}
}

/**
 * 仅网络策略（用于 API）
 */
async function networkOnly(request) {
	return fetchWithTimeout(request);
}

/**
 * 过时重新验证策略
 */
async function staleWhileRevalidate(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	// 发起网络请求更新缓存
	const fetchPromise = fetch(request).then((response) => {
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	}).catch(() => cached);

	// 立即返回缓存（如果有），否则等待网络请求
	return cached || fetchPromise;
}

/**
 * 媒体文件缓存策略（Network First，失败返回缓存）
 * 专门用于 m3u8 和 ts 文件
 * - m3u8 文件：短缓存（5 分钟），因为播放列表可能变化
 * - ts 文件：长缓存（1 小时），因为切片内容不会变化
 */
async function mediaCacheStrategy(request) {
	const url = new URL(request.url);
	const isManifest = url.pathname.endsWith('.m3u8');
	const cacheName = MEDIA_CACHE;
	const cache = await caches.open(cacheName);

	try {
		const response = await fetchWithTimeout(request, {}, 8000);

		if (response.ok) {
			// 克隆响应并缓存
			const responseToCache = response.clone();
			await cache.put(request, responseToCache);
		}

		return response;
	} catch (error) {
		// 网络失败，尝试返回缓存
		const cached = await cache.match(request);

		if (cached) {
			console.log('[SW] 媒体文件使用缓存:', request.url);
			return cached;
		}

		// 缓存也没有，返回空响应（播放器会触发错误处理和线路切换）
		console.warn('[SW] 媒体文件无缓存:', request.url);
		return new Response('', {
			status: 408,
			statusText: 'Request Timeout'
		});
	}
}

// ========== Fetch 事件 ==========

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// 跳过非 http(s) 请求
	if (!url.protocol.startsWith('http')) {
		return;
	}

	// 跳过 chrome-extension 等请求
	if (!url.hostname) {
		return;
	}

	// m3u8/ts 媒体文件：Network First，失败返回缓存
	if (isMediaRequest(url)) {
		event.respondWith(mediaCacheStrategy(request));
		return;
	}

	// P2P 信令请求：网络优先，短缓存
	if (isP2PRequest(url)) {
		event.respondWith(
			networkFirst(request, P2P_CACHE).catch(() => {
				return new Response(
					JSON.stringify({ code: -1, message: 'P2P 服务不可用', data: null }),
					{ headers: { 'Content-Type': 'application/json' }, status: 503 }
				);
			})
		);
		return;
	}

	// Push 相关请求：仅网络
	if (isPushRequest(url)) {
		event.respondWith(
			networkOnly(request).catch(() => {
				return new Response(
					JSON.stringify({ code: -1, message: '推送服务不可用', data: null }),
					{ headers: { 'Content-Type': 'application/json' }, status: 503 }
				);
			})
		);
		return;
	}

	// API 请求：网络优先，失败时返回缓存
	if (isApiRequest(url)) {
		event.respondWith(
			networkFirst(
				request,
				API_CACHE,
				new Response(
					JSON.stringify({
						code: -1,
						message: '网络连接失败，请检查网络',
						data: null
					}),
					{
						headers: { 'Content-Type': 'application/json' },
						status: 503
					}
				)
			).catch(() => {
				// 触发域名切换
				findActiveDomain();
				return new Response(
					JSON.stringify({
						code: -1,
						message: '正在切换线路，请稍后重试',
						data: null
					}),
					{
						headers: { 'Content-Type': 'application/json' },
						status: 503
					}
				);
			})
		);
		return;
	}

	// 图片请求：缓存优先
	if (isImageRequest(url)) {
		event.respondWith(
			cacheFirst(request, IMAGE_CACHE).catch(() => {
				// 返回占位图
				return new Response('', { status: 404 });
			})
		);
		return;
	}

	// 静态资源：缓存优先
	if (isStaticRequest(url)) {
		event.respondWith(
			cacheFirst(request, STATIC_CACHE)
		);
		return;
	}

	// 导航请求：网络优先
	if (isNavigationRequest(request)) {
		// 播放器页面：失败返回离线播放器页面
		if (isPlayerPage(url)) {
			event.respondWith(
				networkFirst(request, STATIC_CACHE).catch(() => {
					// 尝试返回离线播放器页面
					return caches.match('/offline-player.html').then((cached) => {
						if (cached) return cached;
						// 生成离线播放器页面
						return generateOfflinePlayerPage();
					});
				})
			);
			return;
		}

		// 其他导航请求：网络优先，失败返回离线页面
		event.respondWith(
			networkFirst(request, STATIC_CACHE).catch(() => {
				return caches.match('/fallback.html');
			})
		);
		return;
	}

	// 其他请求：过时重新验证
	event.respondWith(
		staleWhileRevalidate(request, STATIC_CACHE)
	);
});

// ========== Push 事件监听 ==========

/**
 * 处理推送通知
 */
self.addEventListener('push', (event) => {
	console.log('[SW] 收到推送通知');

	let data = {
		title: 'XVideos 影视',
		body: '您有新的影视推荐',
		icon: '/icons/icon-192.png',
		badge: '/icons/icon-192.png',
		tag: 'xvideos-notification',
		data: {
			url: '/'
		}
	};

	// 解析推送数据
	if (event.data) {
		try {
			const pushData = event.data.json();
			data = { ...data, ...pushData };
		} catch {
			// 非 JSON 数据，使用文本
			data.body = event.data.text() || data.body;
		}
	}

	const options = {
		body: data.body,
		icon: data.icon,
		badge: data.badge,
		tag: data.tag,
		data: data.data,
		actions: data.actions || [],
		vibrate: [100, 50, 100],
		renotify: true
	};

	event.waitUntil(
		self.registration.showNotification(data.title, options)
	);
});

/**
 * 处理通知点击
 */
self.addEventListener('notificationclick', (event) => {
	console.log('[SW] 通知被点击:', event.notification.tag);

	event.notification.close();

	// 获取点击的目标 URL
	const targetUrl = event.notification.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				// 如果已有窗口打开，聚焦到该窗口
				for (const client of clientList) {
					if (client.url.includes(targetUrl) && 'focus' in client) {
						return client.focus();
					}
				}
				// 否则打开新窗口
				if (self.clients.openWindow) {
					return self.clients.openWindow(targetUrl);
				}
			})
	);
});

/**
 * 处理通知关闭
 */
self.addEventListener('notificationclose', (event) => {
	console.log('[SW] 通知被关闭:', event.notification.tag);
});

// ========== 消息处理 ==========

self.addEventListener('message', (event) => {
	if (!event.data) return;

	switch (event.data.type) {
		case 'CHECK_API_DOMAIN':
			findActiveDomain();
			break;

		case 'SKIP_WAITING':
			self.skipWaiting();
			break;

		case 'CLEAR_CACHE':
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((name) => caches.delete(name))
				);
			});
			break;

		case 'GET_DOMAIN_HEALTH':
			// 返回域名健康状态
			const healthStatus = {};
			domainHealthCache.forEach((value, key) => {
				healthStatus[key] = value;
			});
			event.ports[0]?.postMessage({ type: 'DOMAIN_HEALTH', data: healthStatus });
			break;

		default:
			break;
	}
});

// ========== 后台同步 ==========

self.addEventListener('sync', (event) => {
	// 域名健康检查后台同步
	if (event.tag === 'domain-health-check') {
		event.waitUntil(findActiveDomain());
	}

	// P2P 数据后台同步
	if (event.tag === 'p2p-sync') {
		event.waitUntil(
			caches.open(P2P_CACHE).then((cache) => {
				// 清理过期的 P2P 缓存数据
				return cache.keys().then((requests) => {
					return Promise.all(
						requests.map((request) => {
							return cache.match(request).then((response) => {
								if (response) {
									const date = response.headers.get('date');
									if (date) {
										const cacheTime = new Date(date).getTime();
										const now = Date.now();
										// P2P 缓存有效期 1 小时
										if (now - cacheTime > 3600000) {
											return cache.delete(request);
										}
									}
								}
							});
						})
					);
				});
			})
		);
	}

	// 媒体缓存清理后台同步
	if (event.tag === 'media-cache-cleanup') {
		event.waitUntil(
			caches.open(MEDIA_CACHE).then((cache) => {
				return cache.keys().then((requests) => {
					return Promise.all(
						requests.map((request) => {
							return cache.match(request).then((response) => {
								if (response) {
									const date = response.headers.get('date');
									if (date) {
										const cacheTime = new Date(date).getTime();
										const now = Date.now();
										const url = new URL(request.url);
										// ts 文件缓存有效期 1 小时，m3u8 文件 5 分钟
										const maxAge = url.pathname.endsWith('.m3u8')
											? 5 * 60 * 1000
											: 60 * 60 * 1000;
										if (now - cacheTime > maxAge) {
											return cache.delete(request);
										}
									}
								}
							});
						})
					);
				});
			})
		);
	}
});

// ========== 定期探活 ==========

// 定期探活（使用 setInterval，SW 可能在空闲时被终止，但 activate 和 sync 事件也会触发）
setInterval(() => {
	findActiveDomain();
}, 5 * 60 * 1000);

// 每 30 分钟清理一次过期媒体缓存
setInterval(() => {
	if ('sync' in self.registration) {
		self.registration.sync.register('media-cache-cleanup').catch(() => {});
	}
}, 30 * 60 * 1000);

console.log('[SW] Service Worker 已加载 (v4 - 智能容灾 + 媒体缓存增强)');
