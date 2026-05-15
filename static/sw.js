/// <reference lib="webworker" />

const CACHE_NAME = 'xvideos-v1';
const STATIC_CACHE = 'xvideos-static-v1';
const API_CACHE = 'xvideos-api-v1';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
	'/',
	'/fallback.html',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png'
];

// API 请求超时时间
const API_TIMEOUT = 1500;

// 硬编码的备用 API 域名
const FALLBACK_DOMAINS = [
	'https://api.xvideos1.com',
	'https://api.xvideos2.com',
	'https://api.xvideos3.com'
];

// 安装事件：预缓存静态资源
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => {
			return cache.addAll(PRECACHE_URLS);
		}).then(() => self.skipWaiting())
	);
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
					.map((name) => caches.delete(name))
			);
		}).then(() => self.clients.claim())
	);
});

// 带超时的 fetch
function fetchWithTimeout(url, timeout = API_TIMEOUT) {
	return Promise.race([
		fetch(url),
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error('请求超时')), timeout)
		)
	]);
}

// 检查 API 域名是否可用
async function checkDomain(domain) {
	try {
		const response = await fetchWithTimeout(`${domain}/api/health`, API_TIMEOUT);
		return response.ok;
	} catch {
		return false;
	}
}

// 探测可用 API 域名
async function findActiveDomain() {
	// 尝试从 localStorage 获取上次可用的域名
	for (const domain of FALLBACK_DOMAINS) {
		if (await checkDomain(domain)) {
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
	return FALLBACK_DOMAINS[0];
}

// 判断是否为 API 请求
function isApiRequest(url) {
	return url.pathname.startsWith('/api/');
}

// 判断是否为静态资源请求
function isStaticRequest(url) {
	const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf'];
	return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// Fetch 事件拦截
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// 只处理 GET 请求
	if (event.request.method !== 'GET') return;

	// 跳过 chrome-extension 等非 http(s) 请求
	if (!url.protocol.startsWith('http')) return;

	// API 请求：网络优先，失败时返回缓存或触发域名切换
	if (isApiRequest(url)) {
		event.respondWith(
			fetchWithTimeout(event.request, API_TIMEOUT)
				.then((response) => {
					// 成功时缓存响应
					const responseClone = response.clone();
					caches.open(API_CACHE).then((cache) => {
						cache.put(event.request, responseClone);
					});
					return response;
				})
				.catch(async () => {
					// 网络失败，尝试返回缓存
					const cached = await caches.match(event.request);
					if (cached) return cached;

					// 缓存也没有，触发域名切换
					findActiveDomain();

					// 返回离线响应
					return new Response(
						JSON.stringify({ code: -1, message: '网络连接失败，正在切换线路...' }),
						{
							headers: { 'Content-Type': 'application/json' },
							status: 503
						}
					);
				})
		);
		return;
	}

	// 静态资源：缓存优先
	if (isStaticRequest(url)) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;
				return fetch(event.request).then((response) => {
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(STATIC_CACHE).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// 页面导航请求：网络优先，失败返回骨架屏
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.catch(() => caches.match('/fallback.html'))
		);
		return;
	}
});

// 后台同步：定期检查 API 域名可用性
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CHECK_API_DOMAIN') {
		findActiveDomain();
	}
});

// 定期探活（每 5 分钟）
setInterval(() => {
	findActiveDomain();
}, 5 * 60 * 1000);
