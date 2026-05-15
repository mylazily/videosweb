/**
 * 分类列表页数据加载
 */
import type { Video, Category } from '$lib/types';
import { CATEGORIES } from '$lib/constants';

export async function load({ params }: { params: { slug: string } }) {
	const slug = params.slug || 'movie';
	const category = CATEGORIES.find((c) => c.slug === slug);

	// 模拟分类视频数据
	const videos: Video[] = Array.from({ length: 12 }, (_, i) => ({
		id: `cat_${slug}_${i}`,
		title: `${category?.name || slug} - 影视作品 ${i + 1}`,
		cover: `https://picsum.photos/seed/${slug}${i}/400/225`,
		description: `这是一部精彩的${category?.name || slug}作品`,
		director: '导演' + (i + 1),
		actors: ['演员A', '演员B'],
		year: 2024 - Math.floor(i / 4),
		area: '中国',
		category: category?.name || slug,
		tags: [['热门', '推荐'], ['经典', '高分'], ['新片', '热播']][i % 3],
		rating: 4 + Math.random() * 6,
		play_count: Math.floor(Math.random() * 1000000),
		comment_count: Math.floor(Math.random() * 10000),
		update_time: `2024-12-${String(28 - i).padStart(2, '0')}`,
		sources: []
	}));

	// 确保返回完整的 Category 类型
	const categoryData: Category = category || {
		slug,
		name: slug,
		icon: '',
		count: 0
	};

	return {
		slug,
		category: categoryData,
		videos
	};
}
