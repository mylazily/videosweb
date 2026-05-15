/**
 * 排行榜页数据加载
 */
import type { RankItem } from '$lib/types';

const mockRankItems: RankItem[] = Array.from({ length: 20 }, (_, i) => ({
	rank: i + 1,
	video: {
		id: `rank_${i}`,
		title: `排行榜影片 ${i + 1} - ${['火爆全网', '口碑炸裂', '票房冠军', '豆瓣高分', '必看佳作'][i % 5]}`,
		cover: `https://picsum.photos/seed/rank${i}/400/225`,
		description: '排行榜热门影片',
		director: '导演' + (i + 1),
		actors: ['演员A', '演员B'],
		year: 2024 - Math.floor(i / 5),
		area: '中国',
		category: '电影',
		tags: ['热门'],
		rating: 9.5 - i * 0.3,
		play_count: 10000000 - i * 500000,
		comment_count: 100000 - i * 5000,
		update_time: '2024-12-01',
		sources: []
	},
	change: (i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : 'same') as 'up' | 'down' | 'same',
	change_value: i % 3 === 0 ? i + 1 : i % 3 === 1 ? -(i + 1) : 0
}));

export async function load() {
	return {
		rankItems: mockRankItems
	};
}
