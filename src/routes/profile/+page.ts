/**
 * 个人中心页 - 客户端加载数据（需要 token）
 */

export async function load() {
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
