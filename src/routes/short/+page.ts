/**
 * 短视频列表页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load({ url }: { url: URL }) {
	const sort = url.searchParams.get('sort') || 'popular';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const base = getBaseUrl();

	let shorts: any[] = [];
	let hasMore = false;

	try {
		const res = await fetch(`${base}/api/v1/shorts?page=${page}&page_size=10&sort=${encodeURIComponent(sort)}`);
		if (res.ok) {
			const data = await res.json();
			shorts = data?.data?.list || data?.data || data?.list || [];
			hasMore = shorts.length >= 10;
		}
	} catch {}

	return {
		shorts,
		sort,
		page,
		hasMore
	};
}
