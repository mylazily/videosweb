/**
 * 排行榜页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load() {
	const base = getBaseUrl();
	let rankItems: any[] = [];

	try {
		const res = await fetch(`${base}/api/v1/rank/daily?page=1&page_size=20`);
		if (res.ok) {
			const data = await res.json();
			const list = data?.data?.list || data?.data || data?.list || [];
			rankItems = list.map((item: any, index: number) => ({
				rank: item.rank || index + 1,
				video: item.video || item,
				change: 'same' as const,
				change_value: 0
			}));
		}
	} catch {}

	return {
		rankItems
	};
}
