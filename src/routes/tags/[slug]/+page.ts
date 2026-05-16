/**
 * 标签详情页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load({ params }: { params: { slug: string } }) {
	const slug = params.slug;
	const base = getBaseUrl();

	let tag: any = { slug, name: slug, description: '', video_count: 0, cover: '' };
	let videos: any[] = [];

	try {
		const [tagRes, videosRes] = await Promise.all([
			fetch(`${base}/api/v1/tags/${encodeURIComponent(slug)}`),
			fetch(`${base}/api/v1/tags/${encodeURIComponent(slug)}/videos?page=1&page_size=20`)
		]);

		if (tagRes.ok) {
			const data = await tagRes.json();
			tag = data?.data || tag;
		}

		if (videosRes.ok) {
			const data = await videosRes.json();
			videos = data?.data?.list || data?.data || data?.list || [];
		}
	} catch {}

	return {
		tag,
		videos
	};
}
