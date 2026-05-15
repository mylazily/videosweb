/**
 * 动态生成 sitemap.xml
 * 代理到后端 /sitemap.xml 接口
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function GET() {
	try {
		const base = getBaseUrl();
		const response = await fetch(`${base}/sitemap.xml`);

		if (!response.ok) {
			// 后端不可用时返回默认 sitemap
			const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://xvideos.com/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>https://xvideos.com/short</loc>
		<changefreq>hourly</changefreq>
		<priority>0.9</priority>
	</url>
	<url>
		<loc>https://xvideos.com/rank</loc>
		<changefreq>daily</changefreq>
		<priority>0.8</priority>
	</url>
	<url>
		<loc>https://xvideos.com/tags</loc>
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

		const xml = await response.text();
		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		// 网络错误时返回默认 sitemap
		const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://xvideos.com/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
</urlset>`;
		return new Response(defaultSitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}
}
