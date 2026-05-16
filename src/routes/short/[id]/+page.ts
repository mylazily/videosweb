/**
 * 短视频详情页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load({ params }: { params: { id: string } }) {
	const id = params.id;
	const base = getBaseUrl();

	let short: any = null;
	let comments: any[] = [];

	try {
		const [shortRes, commentsRes] = await Promise.all([
			fetch(`${base}/api/v1/shorts/${encodeURIComponent(id)}`),
			fetch(`${base}/api/v1/videos/${encodeURIComponent(id)}/comments`)
		]);

		if (shortRes.ok) {
			const data = await shortRes.json();
			short = data?.data || null;
		}

		if (commentsRes.ok) {
			const data = await commentsRes.json();
			comments = data?.data?.list || data?.data || data?.list || [];
		}
	} catch {}

	return {
		short,
		comments,
		danmakus: []
	};
}
