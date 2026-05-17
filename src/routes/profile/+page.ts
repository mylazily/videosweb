/**
 * 个人中心页 - 客户端加载数据（需要 token）
 */
import { getToken } from '$lib/auth';
import { getBaseUrl } from '$lib/apiConfig';

export async function load({ fetch }) {
	const token = getToken();

	if (!token) {
		return {
			user: null as any,
			stats: {
				watchCount: 0,
				favoriteCount: 0,
				commentCount: 0,
				followCount: 0
			}
		};
	}

	try {
		const baseUrl = getBaseUrl();
		const res = await fetch(`${baseUrl}/api/v1/user/profile`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (res.ok) {
			const json = await res.json();
			return {
				user: json.data || null,
				stats: {
					watchCount: 0,
					favoriteCount: 0,
					commentCount: 0,
					followCount: 0
				}
			};
		}
	} catch (e) {
		console.error('Failed to load user profile:', e);
	}

	return {
		user: null as any,
		stats: {
			watchCount: 0,
			favoriteCount: 0,
			commentCount: 0,
			followCount: 0
		}
	};
}
