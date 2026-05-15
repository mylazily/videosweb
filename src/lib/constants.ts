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
	HEALTH: '/api/health',

	// 短视频相关
	SHORT_LIST: '/api/v1/shorts',
	SHORT_DETAIL: '/api/v1/shorts',
	SHORT_LIKE: '/api/v1/shorts',
	SHORT_SHARE: '/api/v1/shorts',

	// 标签相关
	TAG_LIST: '/api/v1/tags',
	TAG_DETAIL: '/api/v1/tags',
	TAG_VIDEOS: '/api/v1/tags',

	// 推荐相关
	VIDEO_RELATED: '/api/v1/videos',

	// 分享相关
	SHARE_CREATE: '/api/v1/share',
	SHARE_UNLOCK: '/api/v1/share',

	// 金币相关
	COIN_BALANCE: '/api/v1/coin/balance',
	COIN_RECORDS: '/api/v1/coin/records',

	// 设备相关
	DEVICE_REGISTER: '/api/v1/device/register',

	// SEO
	SITEMAP: '/sitemap.xml',
	ROBOTS: '/robots.txt'
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
	{ path: '/short', label: '短视频', icon: 'video' },
	{ path: '/category/movie', label: '分类', icon: 'grid' },
	{ path: '/rank', label: '排行', icon: 'trophy' },
	{ path: '/profile', label: '我的', icon: 'user' }
] as const;

// ========== XOR 加密密钥 ==========

/** 与后端 middleware/crypto.go 对应的 XOR 密钥 */
export const XOR_KEY = 'XVideos2024SecretKey';

// ========== P2P 相关常量 ==========

/** P2P 信令服务器地址 */
export const P2P_SIGNALING_SERVER = '/api/v1/p2p';

/** P2P 心跳间隔（毫秒） */
export const P2P_HEARTBEAT_INTERVAL = 30000;

/** P2P 自动重连间隔（毫秒） */
export const P2P_RECONNECT_INTERVAL = 5000;

/** P2P 最大重连次数 */
export const P2P_MAX_RECONNECT_ATTEMPTS = 3;

/** P2P 连接超时（毫秒） */
export const P2P_CONNECTION_TIMEOUT = 15000;

/** P2P ICE 服务器配置 */
export const P2P_ICE_SERVERS: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	]
};

/** P2P 数据通道配置 */
export const P2P_DATA_CHANNEL_CONFIG: RTCDataChannelInit = {
	ordered: true,
	maxRetransmits: 3
};

// ========== Push 推送相关常量 ==========

/** VAPID 公钥（后端生成，前端用于订阅） */
export const PUSH_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-GV3WVDRJxPO7KaF0nMqXsOj5wXh2f2eYq0F4c';

/** Push 提示弹窗 localStorage 键名 */
export const PUSH_PROMPT_DISMISSED_KEY = 'xvideos_push_prompt_dismissed';

/** Push 订阅状态 localStorage 键名 */
export const PUSH_SUBSCRIPTION_KEY = 'xvideos_push_subscription';

/** Push 提示延迟显示时间（毫秒） */
export const PUSH_PROMPT_DELAY = 3000;

// ========== 站群相关常量 ==========

/** 站群域名配置 */
export const CLUSTER_DOMAINS: Record<string, { cluster: 'A' | 'B'; is_primary: boolean }> = {
	'xvideos.com': { cluster: 'A', is_primary: true },
	'xvideos1.com': { cluster: 'A', is_primary: false },
	'xvideos2.com': { cluster: 'B', is_primary: true },
	'xvideos3.com': { cluster: 'B', is_primary: false },
	'xvideos4.com': { cluster: 'A', is_primary: false }
};

/** 爬虫 UA 特征列表 */
export const BOT_UA_PATTERNS = [
	'Googlebot', 'Baiduspider', 'Bingbot', 'YandexBot',
	'DuckDuckBot', 'Sogou', '360Spider', 'bot', 'crawler',
	'spider', 'slurp', 'mediapartners'
];

/** 社交媒体 Referrer 域名 */
export const SOCIAL_REFERRER_DOMAINS = [
	't.co', 'twitter.com', 'x.com',
	't.me', 'telegram.org',
	'facebook.com', 'fb.com',
	'weibo.com', 'wx.qq.com'
];

/** PWA 安装提示 localStorage 键名 */
export const PWA_INSTALL_DISMISSED_KEY = 'xvideos_pwa_install_dismissed';

// ========== SEO 相关常量 ==========

/** 网站基础 URL */
export const SITE_BASE_URL = 'https://xvideos.com';

/** 默认 SEO 描述 */
export const DEFAULT_SEO_DESCRIPTION = 'XVideos 影视聚合系统 - 在线观看最新电影、电视剧、动漫、综艺、短视频';

/** 默认 SEO 关键词 */
export const DEFAULT_SEO_KEYWORDS = '影视,电影,电视剧,动漫,综艺,短视频,在线观看';

/** 预渲染标签页列表 */
export const PRERENDER_TAG_SLUGS = [
	'action', 'comedy', 'romance', 'scifi',
	'horror', 'war', 'anime', 'variety'
];
