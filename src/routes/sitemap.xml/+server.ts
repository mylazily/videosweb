/**
 * 动态生成 sitemap.xml
 * 代理到后端 /sitemap.xml 接口
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
		const response = await fetch(`${base}/sitemap.xml`);

		if (response.ok) {
			const xml = await response.text();
			return new Response(xml, {
				headers: {
					'Content-Type': 'application/xml',
					'Cache-Control': 'public, max-age=3600'
				}
			});
		}
	} catch {
		// 后端不可用时返回默认 sitemap
	}

	const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${SITE_BASE_URL}/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${SITE_BASE_URL}/short</loc>
		<changefreq>hourly</changefreq>
		<priority>0.9</priority>
	</url>
	<url>
		<loc>${SITE_BASE_URL}/rank</loc>
		<changefreq>daily</changefreq>
		<priority>0.8</priority>
	</url>
	<url>
		<loc>${SITE_BASE_URL}/tags</loc>
		<changefreq>weekly</changefreq>
		<priority>0.7</priority>
	</url>
</urlset>`;
	return new Response(defaultSitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
