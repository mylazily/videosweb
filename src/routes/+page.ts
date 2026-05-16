/**
 * 首页数据加载
 * 从后端 API 获取真实数据，支持 SSR 和 CSR
 */
import type { Banner, Video, HotWord } from '$lib/types';
import { getBaseUrl } from '$lib/apiConfig';
import { API_PATHS } from '$lib/constants';

export async function load({ fetch: fetchFn }) {
	const base = getBaseUrl();
	const headers = { 'Accept': 'application/json' };

	try {
		// 并发请求所有首页数据
		const [bannerRes, hotWordsRes, hotVideosRes, latestVideosRes] = await Promise.allSettled([
			fetchFn(`${base}${API_PATHS.HOME_BANNER}`, { headers }),
			fetchFn(`${base}${API_PATHS.HOME_HOT_WORDS}`, { headers }),
			fetchFn(`${base}${API_PATHS.VIDEO_HOT}?page=1&page_size=10`, { headers }),
			fetchFn(`${base}${API_PATHS.VIDEO_LATEST}?page=1&page_size=10`, { headers })
		]);

		let banners: Banner[] = [];
		let hotWords: HotWord[] = [];
		let hotVideos: Video[] = [];
		let latestVideos: Video[] = [];

		if (bannerRes.status === 'fulfilled' && bannerRes.value.ok) {
			const data = await bannerRes.value.json();
			banners = data.data || data.banners || [];
		}
		if (hotWordsRes.status === 'fulfilled' && hotWordsRes.value.ok) {
			const data = await hotWordsRes.value.json();
			hotWords = data.data || data.hot_words || [];
		}
		if (hotVideosRes.status === 'fulfilled' && hotVideosRes.value.ok) {
			const data = await hotVideosRes.value.json();
			hotVideos = data.data?.list || data.data || data.videos || [];
		}
		if (latestVideosRes.status === 'fulfilled' && latestVideosRes.value.ok) {
			const data = await latestVideosRes.value.json();
			latestVideos = data.data?.list || data.data || data.videos || [];
		}

		return {
			banners,
			hotWords,
			hotVideos,
			latestVideos
		};
	} catch {
		// API 不可用时返回空数据（让前端显示空状态）
		return {
			banners: [],
			hotWords: [],
			hotVideos: [],
			latestVideos: []
		};
	}
}
