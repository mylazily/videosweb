/**
 * 个人中心页数据加载
 */
import { getBaseUrl } from '$lib/apiConfig';

export async function load() {
	const base = getBaseUrl();
	let user: any = null;

	try {
		const res = await fetch(`${base}/api/v1/user/profile`);
		if (res.ok) {
			const data = await res.json();
			user = data?.data || null;
		}
	} catch {}

	return {
		user,
		stats: {
			watchCount: 0,
			favoriteCount: 0,
			commentCount: 0,
			followCount: 0
		}
	};
}
