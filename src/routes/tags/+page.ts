/**
 * 标签列表页数据加载
 */
import type { Tag } from '$lib/types';

// 模拟标签数据
const mockTags: Tag[] = [
	{ slug: 'action', name: '动作', description: '热血沸腾的动作大片', video_count: 1256, cover: 'https://picsum.photos/seed/tag_action/200/200' },
	{ slug: 'comedy', name: '喜剧', description: '轻松搞笑的喜剧作品', video_count: 987, cover: 'https://picsum.photos/seed/tag_comedy/200/200' },
	{ slug: 'romance', name: '爱情', description: '浪漫唯美的爱情故事', video_count: 876, cover: 'https://picsum.photos/seed/tag_romance/200/200' },
	{ slug: 'scifi', name: '科幻', description: '脑洞大开的科幻世界', video_count: 654, cover: 'https://picsum.photos/seed/tag_scifi/200/200' },
	{ slug: 'horror', name: '恐怖', description: '惊悚刺激的恐怖片', video_count: 543, cover: 'https://picsum.photos/seed/tag_horror/200/200' },
	{ slug: 'anime', name: '动漫', description: '精彩纷呈的动漫世界', video_count: 2345, cover: 'https://picsum.photos/seed/tag_anime/200/200' },
	{ slug: 'documentary', name: '纪录片', description: '真实世界的纪录片', video_count: 432, cover: 'https://picsum.photos/seed/tag_doc/200/200' },
	{ slug: 'war', name: '战争', description: '震撼人心的战争题材', video_count: 321, cover: 'https://picsum.photos/seed/tag_war/200/200' },
	{ slug: 'mystery', name: '悬疑', description: '烧脑悬疑推理作品', video_count: 765, cover: 'https://picsum.photos/seed/tag_mystery/200/200' },
	{ slug: 'fantasy', name: '奇幻', description: '天马行空的奇幻冒险', video_count: 543, cover: 'https://picsum.photos/seed/tag_fantasy/200/200' },
	{ slug: 'thriller', name: '惊悚', description: '紧张刺激的惊悚片', video_count: 432, cover: 'https://picsum.photos/seed/tag_thriller/200/200' },
	{ slug: 'family', name: '家庭', description: '温馨感人的家庭故事', video_count: 321, cover: 'https://picsum.photos/seed/tag_family/200/200' },
	{ slug: 'crime', name: '犯罪', description: '犯罪题材影视作品', video_count: 287, cover: 'https://picsum.photos/seed/tag_crime/200/200' },
	{ slug: 'music', name: '音乐', description: '音乐相关的影视作品', video_count: 198, cover: 'https://picsum.photos/seed/tag_music/200/200' },
	{ slug: 'sports', name: '体育', description: '体育竞技类影视作品', video_count: 156, cover: 'https://picsum.photos/seed/tag_sports/200/200' },
	{ slug: 'history', name: '历史', description: '历史题材影视作品', video_count: 234, cover: 'https://picsum.photos/seed/tag_history/200/200' }
];

export async function load() {
	// 按视频数量排序
	const sorted = [...mockTags].sort((a, b) => b.video_count - a.video_count);

	return {
		tags: sorted
	};
}
