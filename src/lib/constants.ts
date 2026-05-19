/**
 * 全局常量配置
 * 包含分类、API 路径、域名等配置
 */

// ========== 应用信息 ==========

export const APP_NAME = '影视库';
export const APP_VERSION = '1.0.0';

// ========== 分类配置 ==========

export interface Category {
	slug: string;
	name: string;
	icon: string;
}

/** 视频分类列表 */
export const CATEGORIES: Category[] = [
	{ slug: 'movie', name: '电影', icon: '🎬' },
	{ slug: 'tv', name: '电视剧', icon: '📺' },
	{ slug: 'variety', name: '综艺', icon: '🎪' },
	{ slug: 'anime', name: '动漫', icon: '🌸' },
	{ slug: 'documentary', name: '纪录片', icon: '🌍' }
];

/** 分类映射（用于快速查找） */
export const CATEGORY_MAP: Record<string, Category> = {
	movie: { slug: 'movie', name: '电影', icon: '🎬' },
	tv: { slug: 'tv', name: '电视剧', icon: '📺' },
	variety: { slug: 'variety', name: '综艺', icon: '🎪' },
	anime: { slug: 'anime', name: '动漫', icon: '🌸' },
	documentary: { slug: 'documentary', name: '纪录片', icon: '🌍' }
};

// ========== 标签配置 ==========

/** 热门标签 */
export const HOT_TAGS = [
	'动作', '喜剧', '爱情', '科幻', '恐怖', '悬疑', '犯罪', '动画',
	'剧情', '战争', '奇幻', '冒险', '武侠', '古装', '家庭', '历史'
];

// ========== API 路径配置 ==========

/**
 * API 路径常量
 * 与后端 router.go 中的路由定义严格对应
 */
export const API_PATHS = {
	// 健康检查
	HEALTH: '/api/v1/health',
	PING: '/api/v1/ping',

	// 认证
	AUTH_REFRESH: '/api/v1/auth/refresh',

	// 用户
	USER_LOGIN: '/api/v1/auth/login',
	USER_REGISTER: '/api/v1/auth/register',
	USER_PROFILE: '/api/v1/users/profile',
	USER_UPDATE: '/api/v1/users/profile',
	USER_PASSWORD: '/api/v1/users/password',

	// 视频
	VIDEO_LIST: '/api/v1/videos',
	VIDEO_DETAIL: '/api/v1/videos',
	VIDEO_HOT: '/api/v1/videos/hot',
	VIDEO_LATEST: '/api/v1/videos/latest',
	VIDEO_RANDOM: '/api/v1/videos/random',
	VIDEO_EPISODES: '/api/v1/videos',
	VIDEO_TAGS: '/api/v1/videos',
	VIDEO_SEARCH: '/api/v1/videos/search',
	VIDEO_WATCH: '/api/v1/videos',
	VIDEO_PLAY: '/api/v1/videos',
	VIDEO_RELATED: '/api/v1/videos',

	// 搜索
	SEARCH_HOT: '/api/v1/search/hot',

	// 分类
	CATEGORY_LIST: '/api/v1/categories',

	// 标签
	TAG_LIST: '/api/v1/tags',
	TAG_DETAIL: '/api/v1/tags',
	TAG_VIDEOS: '/api/v1/tags',

	// 短视频
	SHORT_LIST: '/api/v1/shorts',
	SHORT_DETAIL: '/api/v1/shorts',
	SHORT_RANDOM: '/api/v1/shorts/random',
	SHORT_VIEW: '/api/v1/shorts',
	SHORT_LIKE: '/api/v1/shorts',

	// 推荐
	RECOMMENDATIONS: '/api/v1/recommendations',

	// 排行榜
	RANK_DAILY: '/api/v1/rank/daily',
	RANK_WEEKLY: '/api/v1/rank/weekly',
	RANK_MONTHLY: '/api/v1/rank/monthly',
	RANK_CATEGORY: '/api/v1/rank/category',

	// 评论
	COMMENT_LIST: '/api/v1/videos',
	COMMENT_ADD: '/api/v1/videos',
	COMMENT_DELETE: '/api/v1/comments',
	COMMENT_LIKE: '/api/v1/comments',
	COMMENT_UNLIKE: '/api/v1/comments',
	COMMENT_REPLIES: '/api/v1/comments',

	// 弹幕
	DANMAKU_LIST: '/api/v1/videos',
	DANMAKU_EPISODE: '/api/v1/videos',
	DANMAKU_SEND: '/api/v1/videos',

	// 观看历史
	HISTORY_LIST: '/api/v1/users/history',

	// 设备
	DEVICE_REGISTER: '/api/v1/devices/register',
	DEVICE_PROFILE: '/api/v1/devices/profile',
	DEVICE_UNLOCK: '/api/v1/devices/unlock',
	DEVICE_CHECK: '/api/v1/devices/unlock',

	// 分享
	SHARE_CREATE: '/api/v1/shares',
	SHARE_DETAIL: '/api/v1/shares',
	SHARE_CLICK: '/api/v1/shares',

	// P2P
	P2P_REGISTER: '/api/v1/p2p/register',
	P2P_HEARTBEAT: '/api/v1/p2p/heartbeat',
	P2P_UNREGISTER: '/api/v1/p2p/unregister',
	P2P_OFFER: '/api/v1/p2p/signal/offer',
	P2P_ANSWER: '/api/v1/p2p/signal/answer',
	P2P_ICE: '/api/v1/p2p/signal/ice',
	P2P_PEERS: '/api/v1/p2p/peers',

	// Push
	PUSH_SUBSCRIBE: '/api/v1/push/subscribe',
	PUSH_UNSUBSCRIBE: '/api/v1/push/unsubscribe',
	PUSH_STATS: '/api/v1/push/stats',

	// X.com
	X_ACCOUNTS: '/api/v1/x/accounts',
	X_POSTS: '/api/v1/x/posts',

	// 支付
	PAYMENT_CHANNELS: '/api/v1/payment/channels',
	PAYMENT_VIP_STATUS: '/api/v1/payment/vip/status',
	PAYMENT_VERIFY: '/api/v1/payment/verify',

	// 奖励
	REWARD_TASKS: '/api/v1/rewards/tasks',
	REWARD_BALANCE: '/api/v1/rewards/balance',
	REWARD_HISTORY: '/api/v1/rewards/history',
	REWARD_DASHBOARD: '/api/v1/rewards/dashboard',

	// 域名
	DOMAIN_ACTIVE: '/api/v1/domains/active',
	DOMAIN_LIST: '/api/v1/domains/list',
	DOMAIN_HEALTHY: '/api/v1/domains/healthy',

	// 资源站
	STATION_STATUS: '/api/v1/stations/status',
	STATION_BEST: '/api/v1/stations/best',
	STATION_ALIVE: '/api/v1/stations/alive',

	// 管理后台
	ADMIN_USERS: '/api/v1/admin/users',
	ADMIN_COLLECT_SOURCES: '/api/v1/admin/collect-sources',
	ADMIN_SITES: '/api/v1/admin/sites',
	ADMIN_REDIRECTS: '/api/v1/admin/redirects',
	ADMIN_PUSH_SEND: '/api/v1/admin/push/send',
	ADMIN_PAYMENT_CREATE: '/api/v1/admin/payment/create',
	ADMIN_REWARD_COMPLETE: '/api/v1/admin/rewards/complete',
	ADMIN_REWARD_UNLOCK: '/api/v1/admin/rewards/unlock',
	ADMIN_REWARD_CHECKIN: '/api/v1/admin/rewards/checkin'
};

// ========== 页面配置 ==========

/** 首页轮播图数量 */
export const HERO_SLIDES_COUNT = 5;

/** 首页每行视频数量 */
export const VIDEOS_PER_ROW = 6;

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 12;

/** 最大分页大小 */
export const MAX_PAGE_SIZE = 48;

// ========== 播放器配置 ==========

/** 播放器快捷键 */
export const PLAYER_SHORTCUTS = {
	SPACE: '播放/暂停',
	F: '全屏',
	M: '静音',
	ARROW_LEFT: '后退 10 秒',
	ARROW_RIGHT: '前进 10 秒',
	ARROW_UP: '音量增加',
	ARROW_DOWN: '音量减少'
};

/** 弹幕配置 */
export const DANMAKU_CONFIG = {
	DEFAULT_OPACITY: 0.8,
	DEFAULT_FONT_SIZE: 18,
	MAX_DANMAKU_COUNT: 100,
	DISPLAY_DURATION: 8000 // 毫秒
};

// ========== API 域名配置 ==========

/** GitHub Gist 地址（存储可用域名列表） */
export const DOMAIN_GIST_URL = 'https://gist.githubusercontent.com/xvideos-domains/main/domains.json';

/**
 * 硬编码备用域名列表
 * 修复: 添加实际可用的备用域名
 */
export const FALLBACK_DOMAINS: string[] = [
	'https://api.555554.xyz',
	'https://9901.555554.xyz',
];

/** 默认 API 域名 */
export const DEFAULT_API_DOMAIN = 'https://api.555554.xyz';

/**
 * 动态获取 API 基础 URL
 *
 * 核心逻辑：
 * 1. 开发环境 (localhost) 使用相对路径，通过 Vite 代理访问后端
 * 2. 生产环境从浏览器地址栏自动提取主域名，拼接 api 二级域名
 * 3. 如果动态域名不可用，切换到备用域名列表
 *
 * 例如：用户访问 https://901.555554.xyz → API 地址为 https://api.555554.xyz
 */
export function getApiBaseUrl(): string {
	if (typeof window === 'undefined') return '';

	const hostname = window.location.hostname;
	const protocol = window.location.protocol;

	// 开发环境检测
	const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
	const isDev = import.meta.env.DEV;

	if (isLocalhost || isDev) {
		// 开发环境：使用相对路径，让 Vite proxy 处理
		return '';
	}

	const parts = hostname.split('.');

	// 如果是 IP 地址或 localhost，使用备用域名
	if (parts.length < 2) {
		return DEFAULT_API_DOMAIN;
	}

	// 检查是否为 IP 地址
	const baseDomain = parts.slice(-2).join('.');
	if (/^\d+\.\d+\.\d+\.\d+$/.test(baseDomain)) {
		return `${protocol}//${hostname}`;
	}

	// 构建 api.{domain} 格式
	return `${protocol}//api.${baseDomain}`;
}

/** 是否为开发环境 */
export function isDevelopment(): boolean {
	if (typeof window === 'undefined') return false;
	const hostname = window.location.hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1' || import.meta.env.DEV;
}

/** 是否应该使用相对路径（开发环境或 Cloudflare 部署） */
export function shouldUseRelativePath(): boolean {
	return isDevelopment();
}

/** API 请求超时时间（毫秒） */
export const API_TIMEOUT = 10000;

/** 域名探活超时时间（毫秒） */
export const DOMAIN_CHECK_TIMEOUT = 5000;

/** 域名健康检查间隔（毫秒） */
export const DOMAIN_HEALTH_CHECK_INTERVAL = 30000;

/** 域名切换超时时间（毫秒） */
export const DOMAIN_SWITCH_TIMEOUT = 5000;

/** 域名轮询检测路径 */
export const DOMAIN_ROTATION_PATH = '/api/v1/health';

// ========== 缓存配置 ==========

/** 视频列表缓存时间（秒） */
export const VIDEO_LIST_CACHE_TTL = 300; // 5 分钟

/** 视频详情缓存时间（秒） */
export const VIDEO_DETAIL_CACHE_TTL = 600; // 10 分钟

/** 用户信息缓存时间（秒） */
export const USER_CACHE_TTL = 3600; // 1 小时

// ========== 功能开关 ==========

/** 是否启用 P2P 加速 */
export const ENABLE_P2P = true;

/** 是否启用弹幕 */
export const ENABLE_DANMAKU = true;

/** 是否启用观看历史 */
export const ENABLE_HISTORY = true;

/** 是否启用推送通知 */
export const ENABLE_PUSH = true;

/** 是否启用金币系统 */
export const ENABLE_REWARD = true;
