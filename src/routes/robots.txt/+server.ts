/**
 * 动态生成 robots.txt
 * 代理到后端 /robots.txt 接口
 */
import { SITE_BASE_URL } from '$lib/constants';

function getServerBaseUrl(): string {
	return import.meta.env.VITE_API_BASE_URL || import.meta.env.PUBLIC_API_BASE_URL || 'https://9901.555554.xyz';
}

export async function GET({ setHeaders }) {
	setHeaders({
		'Cache-Control': 'public, max-age=3600'
	});

	try {
		const base = getServerBaseUrl();
		const response = await fetch(`${base}/robots.txt`);

		if (response.ok) {
			const text = await response.text();
			return new Response(text, {
				headers: {
					'Content-Type': 'text/plain',
					'Cache-Control': 'public, max-age=3600'
				}
			});
		}
	} catch {
		// 后端不可用时返回默认 robots.txt
	}

	const defaultRobots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: ${SITE_BASE_URL}/sitemap.xml
`;
	return new Response(defaultRobots, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
