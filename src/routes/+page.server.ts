/**
 * 首页服务端数据加载
 *
 * "前店后厂"架构核心：
 * - Cloudflare 边缘节点缓存此页面 2 小时（max-age=7200）
 * - 缓存过期后，新用户先看到旧页面，CF 后台静默更新（stale-while-revalidate=14400）
 * - Go 后端负载接近 0，99% 请求由 CF 边缘节点消化
 *
 * 首页每 2-4 小时自动更新一次，满足"几小时更新即可"的需求
 *
 * API 路径与后端 router.go 严格对应：
 * - 热门视频：GET /api/v1/videos/hot
 * - 最新视频：GET /api/v1/videos/latest
 * - 随机推荐：GET /api/v1/videos/random
 * - 热门搜索词：GET /api/v1/search/hot
 */
import type { PageServerLoad } from './$types';
import { getBaseUrl } from '$lib/apiConfig';

export const load: PageServerLoad = async ({ fetch: fetchFn, setHeaders }) => {
	// 告诉 Cloudflare 边缘节点缓存策略
	// max-age=7200: 2 小时内直接返回缓存
	// stale-while-revalidate=14400: 过期后先返回旧缓存，后台静默更新
	setHeaders({
		'cache-control': 'public, max-age=7200, stale-while-revalidate=14400'
	});

	const base = getBaseUrl();
	const headers = { 'Accept': 'application/json' };

	try {
		// 并发请求所有首页数据
		// 所有路径与后端 router.go 严格对应，确保不会 404
		const [hotVideosRes, latestVideosRes, randomRes, hotWordsRes] = await Promise.allSettled([
			fetchFn(`${base}/api/v1/videos/hot?page=1&page_size=12`, { headers }),
			fetchFn(`${base}/api/v1/videos/latest?page=1&page_size=12`, { headers }),
			fetchFn(`${base}/api/v1/videos/random?page_size=6`, { headers }),
			fetchFn(`${base}/api/v1/search/hot`, { headers })
		]);

		let hotVideos: any[] = [];
		let latestVideos: any[] = [];
		let randomVideos: any[] = [];
		let hotWords: any[] = [];

		if (hotVideosRes.status === 'fulfilled' && hotVideosRes.value.ok) {
			const data = await hotVideosRes.value.json();
			hotVideos = data.data?.list || data.data || data.videos || [];
		}
		if (latestVideosRes.status === 'fulfilled' && latestVideosRes.value.ok) {
			const data = await latestVideosRes.value.json();
			latestVideos = data.data?.list || data.data || data.videos || [];
		}
		if (randomRes.status === 'fulfilled' && randomRes.value.ok) {
			const data = await randomRes.value.json();
			randomVideos = data.data?.list || data.data || data.videos || [];
		}
		if (hotWordsRes.status === 'fulfilled' && hotWordsRes.value.ok) {
			const data = await hotWordsRes.value.json();
			hotWords = data.data || data.hot_words || data.words || [];
		}

		return {
			hotVideos,
			latestVideos,
			randomVideos,
			hotWords
		};
	} catch {
		// Go 后端不可用时返回空数据
		// Cloudflare 会缓存这个空页面，但 2 小时后会自动重试
		return {
			hotVideos: [],
			latestVideos: [],
			randomVideos: [],
			hotWords: []
		};
	}
};
