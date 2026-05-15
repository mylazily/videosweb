/**
 * 短视频列表页数据加载
 * 调用 /api/v1/shorts 接口
 */
import type { ShortVideo } from '$lib/types';

// 模拟短视频数据
const mockShorts: ShortVideo[] = Array.from({ length: 20 }, (_, i) => ({
	id: `short_${i}`,
	title: [
		'猫咪日常搞笑瞬间合集',
		'3分钟学会这道家常菜',
		'城市夜景航拍太美了',
		'街头魔术师震惊路人',
		'狗狗的第一次游泳经历',
		'手工达人自制迷你家具',
		'旅行Vlog：云南大理洱海',
		'健身打卡第30天变化',
		'钢琴即兴演奏超治愈',
		'画画过程太解压了',
		'办公室搞笑日常',
		'小朋友的奇思妙想',
		'日落延时摄影',
		'吉他弹唱经典老歌',
		'美食探店隐藏菜单',
		'极限运动挑战合集',
		'猫咪和狗狗的友情',
		'手工制作创意礼物',
		'海边日落太浪漫了',
		'舞蹈翻跳热门歌曲'
	][i],
	cover: `https://picsum.photos/seed/short${i}/400/560`,
	preview_url: `https://picsum.photos/seed/short${i}_preview/400/560`,
	description: '这是一段精彩的短视频内容，快来看看吧！',
	duration: 15 + Math.floor(Math.random() * 180),
	play_count: Math.floor(Math.random() * 5000000),
	like_count: Math.floor(Math.random() * 200000),
	share_count: Math.floor(Math.random() * 50000),
	comment_count: Math.floor(Math.random() * 10000),
	tags: [['搞笑', '日常'], ['美食', '教程'], ['风景', '航拍'], ['魔术', '街头'], ['宠物', '萌宠']][i % 5],
	author: {
		id: `author_${i % 8}`,
		username: [`创作者${i + 1}`, '小明同学', '旅行达人', '美食博主', '健身教练', '音乐人', '画画酱', '极限运动'][i % 8],
		avatar: `https://picsum.photos/seed/avatar${i}/100/100`
	},
	create_time: new Date(Date.now() - i * 3600000 * 2).toISOString(),
	video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
}));

export async function load({ url }: { url: URL }) {
	const sort = url.searchParams.get('sort') || 'popular';
	const page = parseInt(url.searchParams.get('page') || '1', 10);

	// 模拟排序
	let sorted = [...mockShorts];
	switch (sort) {
		case 'latest':
			sorted.sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime());
			break;
		case 'popular':
			sorted.sort((a, b) => b.play_count - a.play_count);
			break;
		case 'random':
			sorted = sorted.sort(() => Math.random() - 0.5);
			break;
	}

	// 分页
	const pageSize = 10;
	const start = (page - 1) * pageSize;
	const paged = sorted.slice(start, start + pageSize);

	return {
		shorts: paged,
		sort,
		page,
		hasMore: start + pageSize < sorted.length
	};
}
