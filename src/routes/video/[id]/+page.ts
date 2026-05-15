/**
 * 视频详情页数据加载（增强版）
 * 支持多线路播放、域名池、共享路径
 */
import type { Video, Comment, Danmaku, PlayLine, VideoDetail } from '$lib/types';

// ========== 模拟数据 ==========

/**
 * 模拟播放线路数据
 */
function getMockPlayLines(): PlayLine[] {
	return [
		{
			source_name: '线路1 - 高清',
			m3u8_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
			domain: 'https://cdn1.example.com',
			path: '/video/123/index.m3u8',
			format: 'm3u8',
			quality: '1080P',
			language: '国语'
		},
		{
			source_name: '线路2 - 备用',
			m3u8_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
			domain: 'https://cdn2.example.com',
			path: '/video/123/index.m3u8',
			format: 'm3u8',
			quality: '720P',
			language: '国语'
		},
		{
			source_name: '线路3 - 极速',
			m3u8_url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
			domain: 'https://cdn3.example.com',
			path: '/video/123/index.m3u8',
			format: 'm3u8',
			quality: '720P',
			language: '粤语'
		}
	];
}

/**
 * 模拟域名池
 */
function getMockDomainPool(): string[] {
	return [
		'https://cdn-backup1.example.com',
		'https://cdn-backup2.example.com',
		'https://cdn-backup3.example.com'
	];
}

/**
 * 模拟视频详情数据（旧格式）
 */
function getMockVideo(id: string): Video {
	return {
		id,
		title: `精彩影视 - ${id}`,
		cover: `https://picsum.photos/seed/detail${id}/800/450`,
		description: '这是一部非常精彩的影视作品，讲述了主人公在逆境中奋起的故事。影片节奏紧凑，剧情跌宕起伏，演员表演出色，是一部不可错过的佳作。',
		director: '知名导演',
		actors: ['主演A', '主演B', '主演C', '配角D'],
		year: 2024,
		area: '中国',
		category: '电影',
		tags: ['动作', '冒险', '科幻'],
		rating: 8.5,
		play_count: 1234567,
		comment_count: 8923,
		update_time: '2024-12-15',
		sources: [
			{
				source_id: 's1',
				source_name: '线路1 - 高清',
				episodes: Array.from({ length: 24 }, (_, i) => ({
					episode_id: `s1_e${i}`,
					episode_name: `第${i + 1}集`,
					episode_url: ''
				}))
			},
			{
				source_id: 's2',
				source_name: '线路2 - 备用',
				episodes: Array.from({ length: 24 }, (_, i) => ({
					episode_id: `s2_e${i}`,
					episode_name: `第${i + 1}集`,
					episode_url: ''
				}))
			}
		]
	};
}

/**
 * 将旧格式视频数据转换为增强版 VideoDetail
 * 如果 API 返回的是旧格式（单个 url），转换为新的 playLines 格式
 */
function toVideoDetail(video: Video): VideoDetail {
	const playLines: PlayLine[] = video.sources.map((source) => ({
		source_name: source.source_name,
		m3u8_url: source.episodes[0]?.episode_url || '',
		domain: undefined,
		path: undefined,
		format: 'm3u8',
		quality: undefined,
		language: undefined
	}));

	return {
		...video,
		clean_title: video.title,
		play_lines: playLines,
		domain_pool: getMockDomainPool(),
		shared_path: '/video/123/index.m3u8',
		source_count: video.sources.length
	};
}

const mockComments: Comment[] = Array.from({ length: 8 }, (_, i) => ({
	id: `comment_${i}`,
	user_id: `user_${i}`,
	username: `用户${i + 1}`,
	avatar: `https://picsum.photos/seed/avatar${i}/100/100`,
	content: [
		'这部电影太好看了，强烈推荐！',
		'剧情很紧凑，演员演技在线',
		'特效很棒，值得一看',
		'结局有点出乎意料，但是很合理',
		'配乐很好听，画面也很美',
		'期待续集！',
		'看了三遍了，每次都有新的发现',
		'安利给身边的朋友了'
	][i],
	like_count: Math.floor(Math.random() * 1000),
	reply_count: Math.floor(Math.random() * 20),
	create_time: new Date(Date.now() - i * 3600000 * 3).toISOString(),
	replies: i % 3 === 0 ? [
		{
			id: `reply_${i}_1`,
			user_id: `reply_user_${i}`,
			username: '回复用户1',
			avatar: `https://picsum.photos/seed/reply${i}/100/100`,
			content: '同意楼主的观点！',
			like_count: 10,
			reply_count: 0,
			create_time: new Date(Date.now() - i * 3600000 * 2).toISOString()
		}
	] : [],
	is_liked: i % 2 === 0
}));

const mockDanmakus: Danmaku[] = Array.from({ length: 30 }, (_, i) => ({
	id: `danmaku_${i}`,
	time: Math.floor(i * 5 + Math.random() * 3),
	content: [
		'666666', '哈哈哈', '太精彩了', '前方高能', '泪目了',
		'名场面', '好家伙', '绝了', '冲冲冲', 'YYDS',
		'来了来了', '太帅了', '笑死我了', '催泪', '经典',
		'好看', '精彩', '妙啊', '牛批', '感动',
		'催泪弹', '笑不活了', '太绝了', '好看好看', '冲',
		'啊啊啊', '太美了', '绝绝子', '好家伙', '妙不可言'
	][i],
	color: ['#FFFFFF', '#FB7299', '#FFD700', '#00FF00', '#00BFFF'][i % 5],
	type: (i % 5 === 0 ? 'top' : 'scroll') as 'scroll' | 'top',
	font_size: 16,
	user_id: `user_${i}`
}));

export async function load({ params }: { params: { id: string } }) {
	const video = getMockVideo(params.id);

	// 转换为增强版 VideoDetail
	const videoDetail = toVideoDetail(video);

	// 如果有模拟的多线路数据，使用模拟数据覆盖
	const playLines = getMockPlayLines();
	videoDetail.play_lines = playLines;

	return {
		video: video,
		videoDetail: videoDetail,
		playLines: playLines,
		domainPool: getMockDomainPool(),
		sharedPath: '/video/123/index.m3u8',
		comments: mockComments,
		danmakus: mockDanmakus
	};
}
