/**
 * 动态生成 robots.txt
 * 代理到后端 /robots.txt 接口
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function GET() {
	try {
		const base = getBaseUrl();
		const response = await fetch(`${base}/robots.txt`);

		if (!response.ok) {
			// 后端不可用时返回默认 robots.txt
			const defaultRobots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: https://xvideos.com/sitemap.xml
`;
			return new Response(defaultRobots, {
				headers: {
					'Content-Type': 'text/plain',
					'Cache-Control': 'public, max-age=3600'
				}
			});
		}

		const text = await response.text();
		return new Response(text, {
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		const defaultRobots = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://xvideos.com/sitemap.xml
`;
		return new Response(defaultRobots, {
			headers: {
				'Content-Type': 'text/plain',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}
}
