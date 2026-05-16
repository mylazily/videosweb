/**
 * 标签列表页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load() {
	const base = getBaseUrl();
	let tags: any[] = [];

	try {
		const res = await fetch(`${base}/api/v1/tags`);
		if (res.ok) {
			const data = await res.json();
			tags = data?.data?.list || data?.data || data?.list || [];
		}
	} catch {}

	return {
		tags
	};
}
