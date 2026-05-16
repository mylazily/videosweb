/**
 * 视频详情页数据加载（增强版）
 * 支持多线路播放、域名池、共享路径
 * 使用真实 API 调用替换模拟数据
 */
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getBaseUrl } from '$lib/apiConfig';

export const load: PageLoad = async ({ params, fetch }) => {
	const { id } = params;
	if (!id) {
		throw error(404, '视频不存在');
	}

	const base = getBaseUrl();

	try {
		// 并发请求视频详情、评论、弹幕
		const [videoRes, commentsRes, danmakuRes] = await Promise.allSettled([
			fetch(`${base}/api/v1/videos/${id}`),
			fetch(`${base}/api/v1/videos/${id}/comments?limit=20`),
			fetch(`${base}/api/v1/videos/${id}/danmaku`)
		]);

		let video = null;
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
			throw error(404, '视频不存在');
		}

		return {
			video,
			videoDetail: video,
			playLines: video.play_lines || [],
			domainPool: video.domain_pool || [],
			sharedPath: video.shared_path || '',
			comments,
			danmakus
		};
	} catch (e) {
		if (e instanceof Error && e.message.includes('404')) {
			throw e;
		}
		throw error(500, '加载视频失败');
	}
};
