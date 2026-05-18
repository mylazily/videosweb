/**
 * 常量定义
 * VideosGo 视频聚合系统
 * 后端部署地址: 9901.555554.xyz
 */

// ========== API 路径（与后端 main.go 完全对应） ==========
// 所有路径前缀统一 /api/v1

export const API_PATHS = {
	// ========== 根路径和健康检查 ==========
	ROOT: '/',
	HEALTH: '/health',
	API_HEALTH: '/api/v1/health',

	// ========== 认证（公开） ==========
	USER_LOGIN: '/api/v1/auth/login',
	USER_REGISTER: '/api/v1/auth/register',
	AUTH_REFRESH: '/api/v1/auth/refresh',

	// ========== 用户（需认证） ==========
	USER_PROFILE: '/api/v1/user/profile',

	// ========== 视频（公开列表，详情需 ID） ==========
	VIDEO_LIST: '/api/v1/videos',
	VIDEO_DETAIL: '/api/v1/videos',           // GET /api/v1/videos/:id

	// ========== 视频操作（需认证） ==========
	VIDEO_COMMENT: '/api/v1/videos',         // POST /api/v1/videos/:id/comments

	// ========== 评论（需认证操作） ==========
	COMMENT_DELETE: '/api/v1/comments',       // DELETE /api/v1/comments/:id
	COMMENT_LIKE: '/api/v1/comments',         // POST /api/v1/comments/:id/like
	COMMENT_UNLIKE: '/api/v1/comments',       // DELETE /api/v1/comments/:id/like
	COMMENT_REPLIES: '/api/v1/comments',      // GET /api/v1/comments/:id/replies

	// ========== 弹幕 ==========
	DANMAKU_LIST: '/api/v1/videos',          // GET /api/v1/videos/:id/danmaku
	DANMAKU_EPISODE: '/api/v1/videos',       // GET /api/v1/videos/:id/episodes/:ep_id/danmaku
	DANMAKU_SEND: '/api/v1/videos',           // POST /api/v1/videos/:id/episodes/:ep_id/danmaku

	// ========== 标签（公开） ==========
	TAG_LIST: '/api/v1/tags',
	TAG_DETAIL: '/api/v1/tags',              // GET /api/v1/tags/:slug
	TAG_VIDEOS: '/api/v1/tags',              // GET /api/v1/tags/:slug/videos

	// ========== 排行榜（公开） ==========
	RANK_DAILY: '/api/v1/rank/daily',
	RANK_WEEKLY: '/api/v1/rank/weekly',
	RANK_MONTHLY: '/api/v1/rank/monthly',
	RANK_CATEGORY: '/api/v1/rank/category',  // GET /api/v1/rank/category/:category

	// ========== 设备验证（需认证） ==========
	DEVICE_CHECK: '/api/v1/device/check',    // GET /api/v1/device/check/:video_id

	// ========== P2P 信令（需认证） ==========
	P2P_REGISTER: '/api/v1/p2p/register',
	P2P_SIGNAL: '/api/v1/p2p/signal',

	// ========== WebSocket（需认证） ==========
	WS_DANMAKU: '/api/v1/ws/danmaku',        // GET /api/v1/ws/danmaku/:video_id
	WS_ONLINE: '/api/v1/ws/online',          // GET /api/v1/ws/online/:video_id

	// ========== 管理后台（需认证+管理员） ==========
	ADMIN_COLLECT_SOURCES: '/api/v1/admin/collect/sources',
	ADMIN_COLLECT_LOGS: '/api/v1/admin/collect/logs',
	ADMIN_VIDEOS: '/api/v1/admin/videos'
} as const;

// ========== API 域名配置 ==========

/** 主 API 域名 */
export const API_BASE_URL = 'https://9901.555554.xyz';

/** 域名列表 Gist URL（可选） */
export const DOMAIN_GIST_URL = 'https://gist.githubusercontent.com/xvideos-domains/main/domains.json';

/** 备用域名列表 */
export const FALLBACK_DOMAINS = [
	'https://9901.555554.xyz'
];

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 8000;

/** 域名探活超时时间（毫秒） */
export const DOMAIN_CHECK_TIMEOUT = 3000;

/** 域名健康检查间隔（毫秒） */
export const DOMAIN_HEALTH_CHECK_INTERVAL = 30000;

/** 域名切换超时时间（毫秒） */
export const DOMAIN_SWITCH_TIMEOUT = 5000;

/** 域名轮换路径 */
export const DOMAIN_ROTATION_PATH = '/api/v1/health';

// ========== 分页配置 ==========

export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

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

// ========== P2P 相关常量 ==========

/** P2P 心跳间隔（毫秒） */
export const P2P_HEARTBEAT_INTERVAL = 30000;

/** P2P 自动重连间隔（毫秒） */
export const P2P_RECONNECT_INTERVAL = 5000;

/** P2P 最大重连次数 */
export const P2P_MAX_RECONNECT_ATTEMPTS = 3;

/** P2P ICE 服务器配置 */
export const P2P_ICE_SERVERS: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' }
	]
};

// ========== WebSocket 弹幕相关常量 ==========

/** 弹幕 WebSocket URL */
export const DANMAKU_WS_URL = `wss://${new URL(API_BASE_URL).host}/api/v1/ws/danmaku`;

/** WebSocket 心跳间隔（毫秒） */
export const WS_HEARTBEAT_INTERVAL = 30000;

/** WebSocket 重连间隔（毫秒） */
export const WS_RECONNECT_INTERVAL = 3000;

/** WebSocket 最大重连次数 */
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

// ========== 广告奖励相关常量 ==========

/** 广告观看时长（秒） */
export const AD_WATCH_DURATION = 30;

/** VIP 弹幕颜色 */
export const VIP_DANMAKU_COLORS = {
	1: '#FFD700', // VIP1 金色
	2: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)' // VIP2 彩虹
};

// ========== SEO 相关常量 ==========

/** 默认 SEO 描述 */
export const DEFAULT_SEO_DESCRIPTION = 'VideosGo 影视聚合系统 - 在线观看最新电影、电视剧、动漫';

/** 默认 SEO 关键词 */
export const DEFAULT_SEO_KEYWORDS = '影视,电影,电视剧,动漫,短视频,在线观看';

// ========== 加密相关常量 ==========

/** XOR 加密密钥 */
export const XOR_KEY = 'videosgo2024';

// ========== 站群相关常量 ==========

/** 站群域名列表 */
export const CLUSTER_DOMAINS: Record<string, {
	domain: string;
	cluster: 'A' | 'B';
	is_primary: boolean;
}> = {};

/** Bot UA 匹配模式 */
export const BOT_UA_PATTERNS = [
	'Googlebot',
	'Bingbot',
	'Slurp',
	'DuckDuckBot',
	'Baiduspider',
	'YandexBot',
	'facebot',
	'Twitterbot',
	'Applebot',
	'Scrapy',
	'curl',
	'wget',
	'python-requests',
	'node-fetch',
	'HttpClient'
];

// ========== P2P 相关配置 ==========

/** P2P 信令服务器 */
export const P2P_SIGNALING_SERVER = '';

/** P2P 数据通道配置 */
export const P2P_DATA_CHANNEL_CONFIG: RTCDataChannelInit = {
	ordered: true,
	maxRetransmits: 3
};

/** P2P 连接超时（毫秒） */
export const P2P_CONNECTION_TIMEOUT = 15000;

// ========== Push 通知相关 ==========

/** VAPID 公钥 */
export const PUSH_VAPID_PUBLIC_KEY = '';

/** Push 订阅密钥 */
export const PUSH_SUBSCRIPTION_KEY = 'push_subscription_v1';

// ========== 奖励相关 ==========

/** 签到奖励金币数 */
export const CHECKIN_REWARD = 10;

/** 看广告奖励金币数 */
export const AD_REWARD = 5;

/** 分享奖励金币数 */
export const SHARE_REWARD = 3;

/** 邀请奖励金币数 */
export const INVITE_REWARD = 20;

// ========== 支付相关 ==========

/** 支付轮询间隔（毫秒） */
export const PAYMENT_POLL_INTERVAL = 3000;

/** 支付订单过期时间（秒） */
export const PAYMENT_ORDER_EXPIRE = 300;

/** VIP 套餐配置 */
export const VIP_PLANS = [
	{ id: 'vip_monthly', name: '月度会员', price: 15, duration: 30 },
	{ id: 'vip_yearly', name: '年度会员', price: 120, duration: 365 }
];

// ========== 社交相关 ==========

/** 社交平台引荐域名列表 */
export const SOCIAL_REFERRER_DOMAINS = [
	'twitter.com',
	'x.com',
	'facebook.com',
	'weibo.com',
	'douyin.com',
	'bilibili.com'
];

// ========== SEO 相关 ==========

/** 网站基础 URL */
export const SITE_BASE_URL = 'https://901.555554.xyz';

// ========== PWA 相关 ==========

/** PWA 安装提示Dismissed 键 */
export const PWA_INSTALL_DISMISSED_KEY = 'pwa_install_dismissed_v1';

// ========== Push Prompt 相关 ==========

/** Push 提示 Dismissed 键 */
export const PUSH_PROMPT_DISMISSED_KEY = 'push_prompt_dismissed_v1';

// ========== 播放器配置 ==========

/** P2P 配置 */
export const P2P_CONFIG = {
	/** 启用 P2P */
	enabled: false,
	/** P2P 下载百分比 */
	downloadRatio: 0.3,
	/** WebRTC 配置 */
	webRTCConfig: {
		iceServers: [
			{ urls: 'stun:stun.l.google.com:19302' }
		]
	}
};
