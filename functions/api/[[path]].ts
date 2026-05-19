/**
 * Cloudflare Pages Function - API 代理
 * 将所有 /api/* 请求代理到后端服务器
 * 修复: CORS credentials + wildcard 冲突
 */

export interface Env {
	API_BASE_URL: string;
}

// 允许的源列表（生产环境应从环境变量配置）
const ALLOWED_ORIGINS = [
	'*', // 开发环境允许所有
];

// 检查 origin 是否在白名单中
function isOriginAllowed(origin: string | null): boolean {
	if (!origin) return true;
	// 开发环境允许所有 origin
	if (ALLOWED_ORIGINS.includes('*')) return true;
	return ALLOWED_ORIGINS.includes(origin);
}

// CORS 预检请求处理
export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
	const origin = request.headers.get('Origin');
	const allowedOrigin = isOriginAllowed(origin) ? (origin || '*') : origin;

	const headers = {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Real-IP, X-Forwarded-For',
		'Access-Control-Max-Age': '86400',
		'Access-Control-Expose-Headers': 'Content-Length, Content-Type, X-Request-ID',
	};

	// 如果有具体的 origin 且不是 *，需要设置 Vary 头
	if (allowedOrigin !== '*' && origin) {
		headers['Vary'] = 'Origin';
	}

	return new Response(null, {
		status: 204,
		headers,
	});
};

export const onRequest: PagesFunction<Env> = async (context) => {
	const { request, env } = context;

	// 后端 API 地址 - 从环境变量获取，不使用硬编码
	const API_BASE = env.API_BASE_URL;

	if (!API_BASE) {
		return new Response(
			JSON.stringify({
				error: 'API_BASE_URL not configured',
				message: '请在 Cloudflare Pages 环境变量中配置 API_BASE_URL',
				timestamp: new Date().toISOString()
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				}
			}
		);
	}

	// 构建目标 URL
	const url = new URL(request.url);
	const targetUrl = `${API_BASE}${url.pathname}${url.search}`;

	// 克隆请求头（安全处理）
	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.set('host', new URL(API_BASE).host);

	// 确保 Content-Type 存在
	if (request.method !== 'GET' && request.method !== 'HEAD' && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}

	// 处理 Origin 头
	const origin = request.headers.get('Origin');
	const allowedOrigin = isOriginAllowed(origin) ? (origin || '*') : origin;

	try {
		// 转发请求
		const modifiedRequest = new Request(targetUrl, {
			method: request.method,
			headers: headers,
			body: request.body,
			redirect: 'follow',
			credentials: 'include',
		});

		const response = await fetch(modifiedRequest, {
			cf: {
				// 禁用缓存
				cacheTtl: 0,
			},
		});

		// 克隆响应头并添加 CORS（根据实际 origin 动态设置）
		const responseHeaders = new Headers(response.headers);

		// 关键修复: 不再同时设置 * 和 credentials
		responseHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
		responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

		// 如果 origin 不是 *，设置 Vary 头
		if (allowedOrigin !== '*' && origin) {
			responseHeaders.set('Vary', 'Origin');
		}

		// 移除可能导致问题的头
		responseHeaders.delete('content-encoding');
		responseHeaders.delete('transfer-encoding');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error('API proxy error:', error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		return new Response(
			JSON.stringify({
				error: 'API request failed',
				message: errorMessage,
				timestamp: new Date().toISOString(),
			}),
			{
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': allowedOrigin,
				},
			}
		);
	}
};
