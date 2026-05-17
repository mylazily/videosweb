// Cloudflare Pages Function - API 代理
// 隐藏后端域名，所有 /api/* 请求转发到 Go 后端
// 前端只需用相对路径 /api/v1/xxx 即可

const BACKEND_URL = 'https://9901.555554.xyz';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  
  // 构建后端URL
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
  
  // 构建代理请求
  const headers = new Headers(context.request.headers);
  headers.set('Host', new URL(BACKEND_URL).host);
  headers.set('X-Forwarded-For', context.request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Real-IP', context.request.headers.get('CF-Connecting-IP') || '');
  
  try {
    const response = await fetch(backendUrl, {
      method: context.request.method,
      headers,
      body: context.request.method !== 'GET' && context.request.method !== 'HEAD' 
        ? await context.request.arrayBuffer() 
        : undefined,
    });

    // 构建响应
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // 移除可能导致问题的头
    responseHeaders.delete('X-Powered-By');
    responseHeaders.delete('Server');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ code: -1, message: 'API代理失败' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
