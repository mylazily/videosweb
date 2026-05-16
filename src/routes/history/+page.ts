/**
 * 观看历史页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load() {
	const base = getBaseUrl();
	let history: any[] = [];

	try {
		const res = await fetch(`${base}/api/v1/user/history?page=1&page_size=20`);
		if (res.ok) {
			const data = await res.json();
			history = data?.data?.list || data?.data || data?.list || [];
		}
	} catch {}

	return {
		history
	};
}
