/// <reference lib="webworker" />

/**
 * Service Worker
 * 优化：改进缓存策略、添加后台同步、优化离线体验
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `xvideos-static-${CACHE_VERSION}`;
const API_CACHE = `xvideos-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `xvideos-images-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_URLS = [
	'/',
	'/fallback.html',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

// API 请求超时时间
const API_TIMEOUT = 5000;

// 硬编码的备用 API 域名
const FALLBACK_DOMAINS = [
	'https://api.xvideos1.com',
	'https://api.xvideos2.com',
	'https://api.xvideos3.com',
	'https://api.xvideos4.com'
];

// 当前激活的 API 域名
let currentApiDomain = FALLBACK_DOMAINS[0];

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
 */
async function checkDomain(domain) {
	try {
		const response = await fetchWithTimeout(
			`${domain}/api/health`,
			{ method: 'GET', mode: 'cors' },
			3000
		);
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * 探测可用 API 域名
 */
async function findActiveDomain() {
	console.log('[SW] 探测可用 API 域名...');

	for (const domain of FALLBACK_DOMAINS) {
		if (await checkDomain(domain)) {
			currentApiDomain = domain;
			console.log('[SW] 找到可用域名:', domain);

			// 通知所有客户端更新域名
			const clients = await self.clients.matchAll();
			clients.forEach((client) => {
				client.postMessage({
					type: 'API_DOMAIN_UPDATE',
					domain: domain
				});
			});

			return domain;
		}
	}

	console.warn('[SW] 未找到可用域名，使用默认域名');
	return FALLBACK_DOMAINS[0];
}

/**
 * 判断是否为 API 请求
 */
function isApiRequest(url) {
	return url.pathname.startsWith('/api/');
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

	// 导航请求：网络优先，失败返回离线页面
	if (isNavigationRequest(request)) {
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

		default:
			break;
	}
});

// ========== 后台同步 ==========

self.addEventListener('sync', (event) => {
	if (event.tag === 'check-api-domain') {
		event.waitUntil(findActiveDomain());
	}
});

// ========== 定期探活 ==========

// 每 5 分钟检查一次 API 域名
setInterval(() => {
	findActiveDomain();
}, 5 * 60 * 1000);

console.log('[SW] Service Worker 已加载');
