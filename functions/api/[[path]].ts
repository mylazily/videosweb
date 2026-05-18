/**
 * Cloudflare Pages Function - API 代理
 * 将所有 /api/* 请求代理到后端服务器
 */

export interface Env {
	API_BASE_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	
	// 后端 API 地址 - 使用 HTTP 直接连接服务器 IP，避免 Cloudflare 代理问题
	const API_BASE = env.API_BASE_URL || 'http://141.148.0.209:8080';
	
	// 构建目标 URL
	const url = new URL(request.url);
	const targetUrl = `${API_BASE}${url.pathname}${url.search}`;
	
	// 创建新的请求头
	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.set('host', new URL(API_BASE).host);
	
	// 转发请求
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: headers,
		body: request.body,
		redirect: 'follow'
	});
	
	try {
		const response = await fetch(modifiedRequest);
		
		// 创建新的响应头
		const responseHeaders = new Headers(response.headers);
		
		// 添加 CORS 头
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('API proxy error:', error);
		return new Response(JSON.stringify({ 
			error: 'API request failed',
			message: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 502,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
	}
};

// 处理 OPTIONS 预检请求
export const onRequestOptions: PagesFunction = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400'
		}
	});
};
