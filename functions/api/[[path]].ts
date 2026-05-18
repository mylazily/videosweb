/**
 * Cloudflare Pages Function - API 代理
 * 将所有 /api/* 请求代理到后端服务器
 */

export interface Env {
	API_BASE_URL: string;
}

// CORS 预检请求处理
export const onRequestOptions: PagesFunction<Env> = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
			'Access-Control-Max-Age': '86400'
		}
	});
};

export const onRequest: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	
	// 后端 API 地址
	const API_BASE = env.API_BASE_URL || 'http://141.148.0.209:8080';
	
	// 构建目标 URL
	const url = new URL(request.url);
	const targetUrl = `${API_BASE}${url.pathname}${url.search}`;
	
	// 克隆请求头
	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.set('host', '141.148.0.209:8080');
	
	// 确保 Content-Type 存在
	if (request.method !== 'GET' && request.method !== 'HEAD' && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}
	
	try {
		// 转发请求
		const modifiedRequest = new Request(targetUrl, {
			method: request.method,
			headers: headers,
			body: request.body,
			redirect: 'follow'
		});
		
		const response = await fetch(modifiedRequest, {
			cf: {
				// 禁用缓存
				cacheTtl: 0
			}
		});
		
		// 克隆响应头并添加 CORS
		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
		
		// 移除可能导致问题的头
		responseHeaders.delete('content-encoding');
		
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('API proxy error:', error);
		
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		
		return new Response(
			JSON.stringify({ 
				error: 'API request failed',
				message: errorMessage,
				timestamp: new Date().toISOString()
			}), 
			{
				status: 502,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			}
		);
	}
};
