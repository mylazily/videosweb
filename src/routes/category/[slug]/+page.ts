/**
 * 分类列表页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load({ params }: { params: { slug: string } }) {
	const slug = params.slug || 'movie';
	const base = getBaseUrl();

	let videos: any[] = [];

	try {
		const res = await fetch(`${base}/api/v1/videos?category=${encodeURIComponent(slug)}&page=1&page_size=20`);
		if (res.ok) {
			const data = await res.json();
			videos = data?.data?.list || data?.data || data?.list || [];
		}
	} catch {}

	return {
		slug,
		category: {
			slug,
			name: slug,
			icon: '',
			count: 0
		},
		videos
	};
}
