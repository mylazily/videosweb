/**
 * 首页数据加载
 */
import type { Banner, Video, HotWord } from '$lib/types';

// 模拟数据（实际项目中从 API 获取）
const mockBanners: Banner[] = [
	{
		id: '1',
		video_id: '101',
		title: '热门推荐：速度与激情10',
		cover: 'https://picsum.photos/seed/banner1/800/400',
		description: '极限飙车，肾上腺素飙升',
		link: '/video/101'
	},
	{
		id: '2',
		video_id: '102',
		title: '新片上线：流浪地球3',
		cover: 'https://picsum.photos/seed/banner2/800/400',
		description: '科幻巨制，震撼来袭',
		link: '/video/102'
	},
	{
		id: '3',
		video_id: '103',
		title: '经典重温：肖申克的救赎',
		cover: 'https://picsum.photos/seed/banner3/800/400',
		description: '永恒的经典，希望的力量',
		link: '/video/103'
	}
];

const mockHotWords: HotWord[] = [
	{ word: '速度与激情10', hot: 99999 },
	{ word: '流浪地球3', hot: 88888 },
	{ word: '封神第二部', hot: 77777 },
	{ word: '热辣滚烫', hot: 66666 },
	{ word: '三体', hot: 55555 },
	{ word: '繁花', hot: 44444 },
	{ word: '狂飙', hot: 33333 },
	{ word: '漫长的季节', hot: 22222 }
];

const mockVideos: Video[] = Array.from({ length: 10 }, (_, i) => ({
	id: String(200 + i),
	title: `热门影视 ${i + 1} - 精彩不容错过的好作品`,
	cover: `https://picsum.photos/seed/video${i}/400/225`,
	description: '这是一部非常精彩的影视作品，讲述了...',
	director: '导演' + (i + 1),
	actors: ['演员A', '演员B', '演员C'],
	year: 2024 - Math.floor(i / 3),
	area: ['中国', '美国', '日本', '韩国'][i % 4],
	category: ['电影', '电视剧', '动漫', '综艺'][i % 4],
	tags: [['动作', '冒险'], ['爱情', '喜剧'], ['科幻', '悬疑'], ['恐怖', '惊悚']][i % 4],
	rating: 5 + Math.random() * 5,
	play_count: Math.floor(Math.random() * 1000000),
	comment_count: Math.floor(Math.random() * 10000),
	update_time: `2024-${String(12 - Math.floor(i / 3)).padStart(2, '0')}-${String(28 - i * 2).padStart(2, '0')}`,
	sources: [
		{
			source_id: 's1',
			source_name: '线路1',
			episodes: Array.from({ length: 24 }, (_, j) => ({
				episode_id: `e${j}`,
				episode_name: `第${j + 1}集`,
				episode_url: ''
			}))
		}
	]
}));

const mockLatestVideos: Video[] = Array.from({ length: 10 }, (_, i) => ({
	id: String(300 + i),
	title: `最新更新 ${i + 1} - 持续热播中`,
	cover: `https://picsum.photos/seed/latest${i}/400/225`,
	description: '最新更新的影视作品',
	director: '导演' + (i + 1),
	actors: ['演员A', '演员B'],
	year: 2024,
	area: '中国',
	category: ['电影', '电视剧', '动漫', '综艺'][i % 4],
	tags: [['动作'], ['爱情'], ['科幻'], ['恐怖']][i % 4],
	rating: 4 + Math.random() * 6,
	play_count: Math.floor(Math.random() * 500000),
	comment_count: Math.floor(Math.random() * 5000),
	update_time: `12-${String(30 - i).padStart(2, '0')}`,
	sources: []
}));

export async function load() {
	return {
		banners: mockBanners,
		hotWords: mockHotWords,
		hotVideos: mockVideos,
		latestVideos: mockLatestVideos
	};
}
