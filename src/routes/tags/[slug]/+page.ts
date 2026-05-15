/**
 * 标签详情页数据加载
 * 增强预渲染支持
 */
import type { Tag, Video } from '$lib/types';

// 预渲染配置
export const prerender = true;

// 模拟标签数据
const mockTags: Record<string, Tag> = {
	action: { slug: 'action', name: '动作', description: '热血沸腾的动作大片，包含各种格斗、枪战、追车等精彩场面', video_count: 1256, cover: 'https://picsum.photos/seed/tag_action/200/200' },
	comedy: { slug: 'comedy', name: '喜剧', description: '轻松搞笑的喜剧作品，让你笑个不停', video_count: 987, cover: 'https://picsum.photos/seed/tag_comedy/200/200' },
	romance: { slug: 'romance', name: '爱情', description: '浪漫唯美的爱情故事，感受爱情的美好', video_count: 876, cover: 'https://picsum.photos/seed/tag_romance/200/200' },
	scifi: { slug: 'scifi', name: '科幻', description: '脑洞大开的科幻世界，探索未来科技', video_count: 654, cover: 'https://picsum.photos/seed/tag_scifi/200/200' }
};

export async function load({ params }: { params: { slug: string } }) {
	const slug = params.slug;
	const tag = mockTags[slug] || {
		slug,
		name: slug,
		description: '这是一个精彩的标签分类',
		video_count: 100,
		cover: ''
	};

	// 模拟该标签下的视频
	const videos: Video[] = Array.from({ length: 12 }, (_, i) => ({
		id: `tag_${slug}_${i}`,
		title: `${tag.name}影视 ${i + 1} - 精彩推荐`,
		cover: `https://picsum.photos/seed/tag_${slug}_${i}/400/225`,
		description: `这是一部精彩的${tag.name}类影视作品`,
		director: '导演' + (i + 1),
		actors: ['演员A', '演员B', '演员C'],
		year: 2024 - Math.floor(i / 4),
		area: ['中国', '美国', '日本', '韩国'][i % 4],
		category: tag.name,
		tags: [tag.name, ['热门', '推荐', '经典', '新片'][i % 4]],
		rating: 4 + Math.random() * 6,
		play_count: Math.floor(Math.random() * 1000000),
		comment_count: Math.floor(Math.random() * 10000),
		update_time: `2024-12-${String(28 - i).padStart(2, '0')}`,
		sources: []
	}));

	return {
		tag,
		videos
	};
}
