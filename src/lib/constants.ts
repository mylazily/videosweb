/**
 * 常量定义
 * XVideos 影视聚合系统
 */

// ========== API 路径 ==========

export const API_PATHS = {
	// 用户相关
	USER_LOGIN: '/api/user/login',
	USER_REGISTER: '/api/user/register',
	USER_INFO: '/api/user/info',
	USER_UPDATE: '/api/user/update',

	// 视频相关
	VIDEO_LIST: '/api/video/list',
	VIDEO_DETAIL: '/api/video/detail',
	VIDEO_PLAY: '/api/video/play',
	VIDEO_SEARCH: '/api/video/search',
	VIDEO_HOT: '/api/video/hot',
	VIDEO_LATEST: '/api/video/latest',
	VIDEO_RECOMMEND: '/api/video/recommend',

	// 分类相关
	CATEGORY_LIST: '/api/category/list',
	CATEGORY_VIDEOS: '/api/category/videos',

	// 评论相关
	COMMENT_LIST: '/api/comment/list',
	COMMENT_ADD: '/api/comment/add',
	COMMENT_LIKE: '/api/comment/like',

	// 弹幕相关
	DANMAKU_LIST: '/api/danmaku/list',
	DANMAKU_SEND: '/api/danmaku/send',

	// 排行榜
	RANK_LIST: '/api/rank/list',

	// 观看历史
	HISTORY_LIST: '/api/history/list',
	HISTORY_ADD: '/api/history/add',
	HISTORY_DELETE: '/api/history/delete',
	HISTORY_CLEAR: '/api/history/clear',

	// 首页
	HOME_BANNER: '/api/home/banner',
	HOME_HOT_WORDS: '/api/home/hot-words',

	// 健康检查
	HEALTH: '/api/health'
} as const;

// ========== 分类列表 ==========

export const CATEGORIES: { slug: string; name: string; icon: string }[] = [
	{ slug: 'movie', name: '电影', icon: '🎬' },
	{ slug: 'tv', name: '电视剧', icon: '📺' },
	{ slug: 'anime', name: '动漫', icon: '🎌' },
	{ slug: 'variety', name: '综艺', icon: '🎤' },
	{ slug: 'documentary', name: '纪录片', icon: '🎥' },
	{ slug: 'short', name: '短视频', icon: '📱' },
	{ slug: 'action', name: '动作片', icon: '💥' },
	{ slug: 'comedy', name: '喜剧片', icon: '😄' },
	{ slug: 'horror', name: '恐怖片', icon: '👻' },
	{ slug: 'romance', name: '爱情片', icon: '💕' },
	{ slug: 'scifi', name: '科幻片', icon: '🚀' },
	{ slug: 'war', name: '战争片', icon: '⚔️' }
];

// ========== API 域名配置 ==========

/** GitHub Gist 地址（存储可用域名列表） */
export const DOMAIN_GIST_URL = 'https://gist.githubusercontent.com/xvideos-domains/main/domains.json';

/** 硬编码备用域名列表 */
export const FALLBACK_DOMAINS = [
	'https://api.xvideos1.com',
	'https://api.xvideos2.com',
	'https://api.xvideos3.com',
	'https://api.xvideos4.com'
];

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 1500;

/** 域名探活超时时间（毫秒） */
export const DOMAIN_CHECK_TIMEOUT = 1500;

// ========== 分页配置 ==========

export const PAGE_SIZE = 20;

// ========== 播放器配置 ==========

export const PLAYER_CONFIG = {
	/** 自动播放 */
	AUTO_PLAY: true,
	/** 默认音量 */
	DEFAULT_VOLUME: 0.8,
	/** 进度上报间隔（秒） */
	PROGRESS_REPORT_INTERVAL: 10,
	/** 最大缓冲时长（秒） */
	MAX_BUFFER_LENGTH: 30,
	/** 弹幕透明度 */
	DANMAKU_OPACITY: 0.8,
	/** 弹幕字体大小 */
	DANMAKU_FONT_SIZE: 16,
	/** 弹幕速度（像素/秒） */
	DANMAKU_SPEED: 120
};

// ========== 主题色 ==========

export const THEME = {
	PRIMARY: '#FB7299',
	PRIMARY_DARK: '#E45580',
	PRIMARY_LIGHT: '#FCAFC6',
	DARK_BG: '#17181A',
	DARK_CARD: '#222325',
	DARK_BORDER: '#2E2F31'
};

// ========== 导航栏配置 ==========

export const NAV_ITEMS = [
	{ path: '/', label: '首页', icon: 'home' },
	{ path: '/category/movie', label: '分类', icon: 'grid' },
	{ path: '/rank', label: '排行', icon: 'trophy' },
	{ path: '/history', label: '历史', icon: 'clock' },
	{ path: '/profile', label: '我的', icon: 'user' }
] as const;

// ========== XOR 加密密钥 ==========

/** 与后端 middleware/crypto.go 对应的 XOR 密钥 */
export const XOR_KEY = 'XVideos2024SecretKey';
