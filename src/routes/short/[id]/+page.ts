/**
 * 短视频详情页数据加载
 */
import type { ShortVideo, Comment, Danmaku } from '$lib/types';

// 模拟短视频详情数据
function getMockShort(id: string): ShortVideo {
	const titles: Record<string, string> = {
		'0': '猫咪日常搞笑瞬间合集',
		'1': '3分钟学会这道家常菜',
		'2': '城市夜景航拍太美了'
	};
	return {
		id,
		title: titles[id] || `精彩短视频 - ${id}`,
		cover: `https://picsum.photos/seed/short_detail_${id}/400/560`,
		preview_url: `https://picsum.photos/seed/short_detail_${id}_preview/400/560`,
		description: '这是一段非常精彩的短视频内容，创作者用心制作，值得一看！点赞关注不迷路~',
		duration: 30 + Math.floor(Math.random() * 120),
		play_count: Math.floor(Math.random() * 5000000),
		like_count: Math.floor(Math.random() * 200000),
		share_count: Math.floor(Math.random() * 50000),
		comment_count: Math.floor(Math.random() * 10000),
		tags: ['搞笑', '日常', '热门'],
		author: {
			id: 'author_1',
			username: '创作者小明',
			avatar: 'https://picsum.photos/seed/author1/100/100'
		},
		create_time: new Date(Date.now() - 3600000).toISOString(),
		video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
	};
}

// 模拟评论数据
const mockComments: Comment[] = Array.from({ length: 10 }, (_, i) => ({
	id: `sc_${i}`,
	user_id: `su_${i}`,
	username: `用户${i + 1}`,
	avatar: `https://picsum.photos/seed/savatar${i}/100/100`,
	content: [
		'太搞笑了哈哈哈',
		'这也太厉害了吧',
		'收藏了慢慢看',
		'已关注，期待更新',
		'第一次看到这种操作',
		'学到了学到了',
		'转发给朋友看了',
		'每天都要看一遍',
		'这也太治愈了',
		'大拇指送给UP主'
	][i],
	like_count: Math.floor(Math.random() * 5000),
	reply_count: Math.floor(Math.random() * 50),
	create_time: new Date(Date.now() - i * 1800000).toISOString(),
	is_liked: i % 3 === 0
}));

// 模拟弹幕数据
const mockDanmakus: Danmaku[] = Array.from({ length: 20 }, (_, i) => ({
	id: `sd_${i}`,
	time: Math.floor(i * 3 + Math.random() * 2),
	content: [
		'666', '哈哈哈', '太强了', '前方高能', '泪目',
		'名场面', '好家伙', '绝了', '冲冲冲', 'YYDS',
		'来了来了', '太帅了', '笑死', '催泪', '经典',
		'好看', '精彩', '妙啊', '牛批', '感动'
	][i],
	color: ['#FFFFFF', '#FB7299', '#FFD700', '#00FF00', '#00BFFF'][i % 5],
	type: (i % 5 === 0 ? 'top' : 'scroll') as 'scroll' | 'top',
	font_size: 16,
	user_id: `su_${i}`
}));

export async function load({ params }: { params: { id: string } }) {
	return {
		short: getMockShort(params.id),
		comments: mockComments,
		danmakus: mockDanmakus
	};
}
