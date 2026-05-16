/**
 * 视频详情页服务端加载（短路由 /v/[id]）
 *
 * SEO 核心：
 * - 长尾词语义注入：title = "免费在线观看 {标题} 全集无删减 {分类}"
 * - Open Graph + Twitter Card 完整 meta
 * - JSON-LD VideoObject 结构化数据（仅视频页）
 * - Cloudflare 边缘缓存 2 小时
 */
import type { PageServerLoad } from './$types';
import { getBaseUrl } from '$lib/apiConfig';
import { SITE_BASE_URL } from '$lib/constants';

export const load: PageServerLoad = async ({ params, fetch: fetchFn, setHeaders }) => {
	const { id } = params;

	// Cloudflare 边缘缓存 2 小时
	setHeaders({
		'cache-control': 'public, max-age=7200, stale-while-revalidate=14400'
	});

	const base = getBaseUrl();
	const headers = { 'Accept': 'application/json' };

	try {
		// 并发请求视频详情、评论、弹幕
		const [videoRes, commentsRes, danmakuRes] = await Promise.allSettled([
			fetchFn(`${base}/api/v1/videos/${id}`, { headers }),
			fetchFn(`${base}/api/v1/videos/${id}/comments?limit=20`, { headers }),
			fetchFn(`${base}/api/v1/videos/${id}/danmaku`, { headers })
		]);

		let video: any = null;
		let comments: any[] = [];
		let danmakus: any[] = [];

		if (videoRes.status === 'fulfilled' && videoRes.value.ok) {
			const data = await videoRes.value.json();
			video = data.data || data.video || null;
		}
		if (commentsRes.status === 'fulfilled' && commentsRes.value.ok) {
			const data = await commentsRes.value.json();
			comments = data.data?.list || data.data || [];
		}
		if (danmakuRes.status === 'fulfilled' && danmakuRes.value.ok) {
			const data = await danmakuRes.value.json();
			danmakus = data.data || [];
		}

		if (!video) {
			return {
				video: null,
				comments: [],
				danmakus: [],
				playLines: [],
				domainPool: [],
				sharedPath: '',
				seo: null
			};
		}

		// 提取播放线路
		const playLines = video.play_lines || [];
		const domainPool = video.domain_pool || [];
		const sharedPath = video.shared_path || '';

		// 长尾 SEO 数据生成
		const category = video.category || '';
		const year = video.year || '';
		const area = video.area || '';
		const actors = video.actors || '';

		// 长尾词组合："免费在线观看 {标题} 全集无删减 {分类}"
		const seoTitle = `免费在线观看 ${video.title} 全集无删减${category ? ' ' + category : ''}`;
		const seoDescription = `${video.title}${year ? ' (' + year + ')' : ''}${area ? ' ' + area : ''} - ${video.description || '在线观看完整版，高清流畅，多线路免费播放'}. 主演：${actors}。${category ? '类型：' + category + '。' : ''}免费在线观看全集无删减版。`;

		const seo = {
			title: seoTitle,
			description: seoDescription.slice(0, 160), // Google 截断限制
			keywords: `${video.title},${category},${year},${area},${actors},免费在线观看,全集无删减,高清`,
			ogImage: video.cover || '',
			ogUrl: `${SITE_BASE_URL}/v/${id}`,
			canonical: `${SITE_BASE_URL}/v/${id}`,
			// JSON-LD VideoObject 结构化数据
			structuredData: {
				'@context': 'https://schema.org',
				'@type': 'VideoObject',
				name: video.title,
				description: video.description || seoDescription,
				thumbnailUrl: video.cover || '',
				uploadDate: video.created_at || video.update_time || new Date().toISOString(),
				duration: video.duration ? `PT${video.duration}S` : undefined,
				publisher: {
					'@type': 'Organization',
					name: 'XVideos 影视',
					logo: {
						'@type': 'ImageObject',
						url: `${SITE_BASE_URL}/icons/icon-512.png`
					}
				},
				inLanguage: 'zh-CN'
			}
		};

		return {
			video,
			comments,
			danmakus,
			playLines,
			domainPool,
			sharedPath,
			seo
		};
	} catch {
		return {
			video: null,
			comments: [],
			danmakus: [],
			playLines: [],
			domainPool: [],
			sharedPath: '',
			seo: null
		};
	}
};

// 导出 prerender = false，确保动态路由不会被预渲染
export const prerender = false;
