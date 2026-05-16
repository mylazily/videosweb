/**
 * 常量定义
 * XVideos 影视聚合系统
 */

// ========== API 路径 ==========
// 所有路径与后端 router.go 严格对应，前缀统一 /api/v1

export const API_PATHS = {
	// ========== 健康检查 ==========
	PING: '/api/v1/ping',
	HEALTH: '/api/v1/health',

	// ========== 认证（公开） ==========
	USER_LOGIN: '/api/v1/auth/login',
	USER_REGISTER: '/api/v1/auth/register',
	AUTH_REFRESH: '/api/v1/auth/refresh',

	// ========== 用户（需认证） ==========
	USER_PROFILE: '/api/v1/user/profile',
	USER_UPDATE: '/api/v1/user/profile',
	USER_PASSWORD: '/api/v1/user/password',

	// ========== 视频（公开） ==========
	VIDEO_LIST: '/api/v1/videos',
	VIDEO_DETAIL: '/api/v1/videos',           // GET /api/v1/videos/:id
	VIDEO_HOT: '/api/v1/videos/hot',
	VIDEO_LATEST: '/api/v1/videos/latest',
	VIDEO_RANDOM: '/api/v1/videos/random',
	VIDEO_EPISODES: '/api/v1/videos',          // GET /api/v1/videos/:id/episodes
	VIDEO_TAGS: '/api/v1/videos',              // GET /api/v1/videos/:id/tags
	VIDEO_RELATED: '/api/v1/videos',           // GET /api/v1/videos/:id/related
	VIDEO_SEARCH: '/api/v1/search',
	SEARCH_HOT: '/api/v1/search/hot',
	VIDEO_WATCH: '/api/v1/videos',             // POST /api/v1/videos/:id/watch（需认证）
	VIDEO_PLAY: '/api/v1/videos',              // GET /api/v1/videos/:id/play

	// ========== 分类（公开） ==========
	CATEGORY_LIST: '/api/v1/categories',

	// ========== 标签（公开） ==========
	TAG_LIST: '/api/v1/tags',
	TAG_DETAIL: '/api/v1/tags',               // GET /api/v1/tags/:slug
	TAG_VIDEOS: '/api/v1/tags',               // GET /api/v1/tags/:slug/videos

	// ========== 短视频（公开） ==========
	SHORT_LIST: '/api/v1/shorts',
	SHORT_DETAIL: '/api/v1/shorts',           // GET /api/v1/shorts/:id
	SHORT_RANDOM: '/api/v1/shorts/random',
	SHORT_VIEW: '/api/v1/shorts',             // POST /api/v1/shorts/:id/view
	SHORT_LIKE: '/api/v1/shorts',             // POST /api/v1/shorts/:id/like

	// ========== 推荐（公开） ==========
	RECOMMENDATIONS: '/api/v1/recommendations',

	// ========== 排行榜（公开） ==========
	RANK_DAILY: '/api/v1/rank/daily',
	RANK_WEEKLY: '/api/v1/rank/weekly',
	RANK_MONTHLY: '/api/v1/rank/monthly',
	RANK_CATEGORY: '/api/v1/rank/category',    // GET /api/v1/rank/category/:category

	// ========== 评论（公开查看，需认证操作） ==========
	COMMENT_LIST: '/api/v1/videos',            // GET /api/v1/videos/:id/comments
	COMMENT_ADD: '/api/v1/videos',             // POST /api/v1/videos/:id/comments
	COMMENT_DELETE: '/api/v1/comments',        // DELETE /api/v1/comments/:id
	COMMENT_LIKE: '/api/v1/comments',          // POST /api/v1/comments/:id/like
	COMMENT_UNLIKE: '/api/v1/comments',        // DELETE /api/v1/comments/:id/like
	COMMENT_REPLIES: '/api/v1/comments',       // GET /api/v1/comments/:id/replies

	// ========== 弹幕（公开查看，需认证发送） ==========
	DANMAKU_LIST: '/api/v1/videos',            // GET /api/v1/videos/:id/danmaku
	DANMAKU_EPISODE: '/api/v1/videos',         // GET /api/v1/videos/:id/episodes/:ep_id/danmaku
	DANMAKU_SEND: '/api/v1/videos',            // POST /api/v1/videos/:id/episodes/:ep_id/danmaku

	// ========== 观看历史（需认证） ==========
	HISTORY_LIST: '/api/v1/user/history',

	// ========== 设备指纹（公开） ==========
	DEVICE_REGISTER: '/api/v1/device/register',
	DEVICE_PROFILE: '/api/v1/device/profile',
	DEVICE_UNLOCK: '/api/v1/device/unlock',
	DEVICE_CHECK: '/api/v1/device/check',     // GET /api/v1/device/check/:videoId

	// ========== 分享裂变（公开） ==========
	SHARE_CREATE: '/api/v1/share/create',
	SHARE_DETAIL: '/api/v1/share',            // GET /api/v1/share/:code
	SHARE_CLICK: '/api/v1/share',             // POST /api/v1/share/:code/click

	// ========== P2P 信令（公开） ==========
	P2P_REGISTER: '/api/v1/p2p/register',
	P2P_HEARTBEAT: '/api/v1/p2p/heartbeat',
	P2P_UNREGISTER: '/api/v1/p2p/unregister',
	P2P_OFFER: '/api/v1/p2p/signal/offer',
	P2P_ANSWER: '/api/v1/p2p/signal/answer',
	P2P_ICE: '/api/v1/p2p/signal/ice',
	P2P_PEERS: '/api/v1/p2p/peers',           // GET /api/v1/p2p/peers/:videoId

	// ========== Push 推送（公开） ==========
	PUSH_SUBSCRIBE: '/api/v1/push/subscribe',
	PUSH_UNSUBSCRIBE: '/api/v1/push/subscribe',
	PUSH_STATS: '/api/v1/push/stats',

	// ========== TG Bot（公开） ==========
	TG_WEBHOOK: '/api/v1/tg/webhook',
	TG_CHANNELS: '/api/v1/tg/channels',
	TG_MINIAPP_SESSION: '/api/v1/tg/miniapp/session',
	TG_MINIAPP_STATS: '/api/v1/tg/miniapp/stats',

	// ========== X.com（公开） ==========
	X_ACCOUNTS: '/api/v1/x/accounts',
	X_POSTS: '/api/v1/x/posts',

	// ========== 支付（公开接口） ==========
	PAYMENT_CHANNELS: '/api/v1/payment/channels',
	PAYMENT_VIP_STATUS: '/api/v1/payment/vip/status',
	PAYMENT_VERIFY: '/api/v1/payment/verify',

	// ========== 广告金币（公开接口） ==========
	REWARD_TASKS: '/api/v1/reward/tasks',
	REWARD_BALANCE: '/api/v1/reward/balance',
	REWARD_HISTORY: '/api/v1/reward/history',
	REWARD_DASHBOARD: '/api/v1/reward/dashboard',

	// ========== 域名轮询（公开） ==========
	DOMAIN_ACTIVE: '/api/v1/domain/active',
	DOMAIN_LIST: '/api/v1/domain/list',
	DOMAIN_HEALTHY: '/api/v1/domains/healthy',

	// ========== 资源站监控（公开） ==========
	STATION_STATUS: '/api/v1/stations/status',
	STATION_BEST: '/api/v1/stations/best',
	STATION_ALIVE: '/api/v1/stations/alive',

	// ========== WebSocket ==========
	WS_DANMAKU: '/api/v1/ws/danmaku',         // GET /api/v1/ws/danmaku/:videoId
	WS_ONLINE: '/api/v1/ws/online',            // GET /api/v1/ws/online/:videoId

	// ========== 管理后台（需认证+管理员） ==========
	ADMIN_USERS: '/api/v1/admin/users',
	ADMIN_COLLECT_SOURCES: '/api/v1/admin/collect/sources',
	ADMIN_SITES: '/api/v1/admin/sites',
	ADMIN_REDIRECTS: '/api/v1/admin/redirects',
	ADMIN_PUSH_SEND: '/api/v1/admin/push/send',
	ADMIN_TG_BROADCAST: '/api/v1/admin/tg/broadcast',
	ADMIN_X_POST: '/api/v1/admin/x/post',
	ADMIN_PAYMENT_CREATE: '/api/v1/admin/payment/create',
	ADMIN_DOMAIN_SWITCH: '/api/v1/admin/domain/switch',
	ADMIN_REWARD_COMPLETE: '/api/v1/admin/reward/complete',
	ADMIN_REWARD_UNLOCK: '/api/v1/admin/reward/unlock',
	ADMIN_REWARD_CHECKIN: '/api/v1/admin/reward/checkin',
	ADMIN_STATIONS_CHECK: '/api/v1/admin/stations/check',

	// ========== SEO（无 /api/v1 前缀） ==========
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
	'https://9901.555554.xyz'
];

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 5000;

/** 域名探活超时时间（毫秒） */
export const DOMAIN_CHECK_TIMEOUT = 3000;

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

// ========== TG Mini App 相关常量 ==========

/** TG Mini App Bot Token（后端验证用） */
export const TG_BOT_TOKEN = '';

/** TG Mini App 深度链接 */
export const TG_DEEP_LINK = 'https://t.me/xvideos_bot/app';

/** TG 主题色（Mini App 内使用） */
export const TG_THEME = {
	BG_COLOR: '#1a1a2e',
	TEXT_COLOR: '#ffffff',
	BUTTON_COLOR: '#FB7299',
	BUTTON_TEXT_COLOR: '#ffffff',
	SECONDARY_BG_COLOR: '#16213e'
};

/** TG Mini App 最大初始化等待时间（毫秒） */
export const TG_INIT_TIMEOUT = 3000;

// ========== 支付相关常量 ==========

/** 支付轮询间隔（毫秒） */
export const PAYMENT_POLL_INTERVAL = 2000;

/** 支付订单过期时间（秒） */
export const PAYMENT_ORDER_EXPIRE = 1800;

/** VIP 套餐列表 */
export const VIP_PLANS = [
	{
		id: 'vip_month',
		name: '月度会员',
		level: 1,
		duration_days: 30,
		price: 9.99,
		original_price: 19.99,
		currency: 'USDT',
		description: '解锁全部高清内容',
		features: ['高清1080P', '无广告', '专属弹幕样式', '优先客服'],
		is_recommended: false
	},
	{
		id: 'vip_year',
		name: '年度会员',
		level: 2,
		duration_days: 365,
		price: 79.99,
		original_price: 119.99,
		currency: 'USDT',
		description: '尊享年度会员权益',
		features: ['超清4K', '无广告', '专属弹幕样式', '优先客服', '离线缓存', '多设备同时在线'],
		is_recommended: true
	}
];

/** 支持的支付渠道类型 */
export const PAYMENT_CHANNEL_TYPES = ['crypto', 'alipay', 'wechat'] as const;

// ========== 广告奖励相关常量 ==========

/** 广告观看时长（秒） */
export const AD_WATCH_DURATION = 30;

/** 每日签到奖励金币 */
export const CHECKIN_REWARD = 10;

/** 每日看广告奖励金币 */
export const AD_REWARD = 20;

/** 每日分享奖励金币 */
export const SHARE_REWARD = 15;

/** 每日邀请奖励金币 */
export const INVITE_REWARD = 50;

/** 每日最大广告观看次数 */
export const MAX_DAILY_AD_WATCH = 10;

/** 每日最大分享次数 */
export const MAX_DAILY_SHARE = 5;

// ========== WebSocket 弹幕相关常量 ==========

/** 弹幕 WebSocket 地址 */
export const DANMAKU_WS_URL = 'wss://xvideos.com/ws/danmaku';

/** WebSocket 心跳间隔（毫秒） */
export const WS_HEARTBEAT_INTERVAL = 30000;

/** WebSocket 重连间隔（毫秒） */
export const WS_RECONNECT_INTERVAL = 3000;

/** WebSocket 最大重连次数 */
export const WS_MAX_RECONNECT_ATTEMPTS = 5;

/** VIP 弹幕颜色 */
export const VIP_DANMAKU_COLORS = {
	1: '#FFD700', // VIP1 金色
	2: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF)' // VIP2 彩虹
};

// ========== 域名轮询相关常量 ==========

/** 域名健康检查间隔（毫秒） */
export const DOMAIN_HEALTH_CHECK_INTERVAL = 60000;

/** 域名切换最大超时（毫秒） */
export const DOMAIN_SWITCH_TIMEOUT = 100;

/** 域名轮询 API 路径 */
export const DOMAIN_ROTATION_PATH = '/api/v1/domain/rotation';

/** 域名健康检查 API（返回最健康的 3 个域名） */
export const DOMAIN_HEALTHY_PATH = '/api/v1/domains/healthy';

// ========== P2P HLS 播放器配置 ==========

export const P2P_CONFIG = {
	/** HTTP 下载超时（毫秒） */
	HTTP_DOWNLOAD_TIMEOUT: 5000,
	/** 同时从资源站下载的切片数 */
	SIMULTANEOUS_HTTP_DOWNLOADS: 2,
	/** 最大缓冲时长（秒） */
	MAX_BUFFER_LENGTH: 60,
	/** 高峰期极限缓冲时长（秒） */
	MAX_MAX_BUFFER_LENGTH: 120,
	/** 自动跳过卡顿死点阈值（秒） */
	MAX_BUFFER_HOLE: 0.5,
	/** 回放缓冲保留时长（秒） */
	BACK_BUFFER_LENGTH: 30,
	/** 低速阈值（字节/秒）—— 100KB/s */
	LOW_SPEED_THRESHOLD: 100 * 1024,
	/** 高速阈值（字节/秒）—— 500KB/s */
	HIGH_SPEED_THRESHOLD: 500 * 1024,
	/** P2P 统计刷新间隔（毫秒） */
	STATS_UPDATE_INTERVAL: 1000,
	/** 缓冲区动态优化检测间隔（毫秒） */
	BUFFER_OPTIMIZE_INTERVAL: 3000,
	/** 低速时降低的预加载阈值（秒） */
	LOW_SPEED_BUFFER_LENGTH: 15,
	/** 低速时降低的极限缓冲时长（秒） */
	LOW_SPEED_MAX_BUFFER_LENGTH: 30
};
