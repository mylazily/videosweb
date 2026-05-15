/**
 * 个人中心页数据加载
 */
import type { User } from '$lib/types';

const mockUser: User = {
	id: 'user_001',
	username: '影视爱好者',
	avatar: 'https://picsum.photos/seed/user/200/200',
	email: 'user@example.com',
	vip_level: 1,
	create_time: '2024-01-01T00:00:00Z'
};

export async function load() {
	return {
		user: mockUser,
		stats: {
			watchCount: 128,
			favoriteCount: 36,
			commentCount: 52,
			followCount: 15
		}
	};
}
