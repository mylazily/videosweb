/**
 * TypeScript 类型定义
 * XVideos 影视聚合系统
 */

// ========== 通用响应 ==========

/** API 响应状态码 */
export enum ApiCode {
	SUCCESS = 0,
	ERROR = -1,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	SERVER_ERROR = 500
}

/** API 统一响应结构 */
export interface ApiResponse<T = unknown> {
	code: number;
	message: string;
	data: T;
}

/** API 错误响应 */
export interface ApiError {
	code: number;
	message: string;
	details?: string;
}

/** 分页数据 */
export interface PaginatedData<T> {
	list: T[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}

/** 分页请求参数 */
export interface PaginationParams {
	page?: number;
	page_size?: number;
}

// ========== 视频相关 ==========

/** 视频信息 */
export interface Video {
	id: string;
	title: string;
	cover: string;
	description: string;
	director: string;
	actors: string[];
	year: number;
	area: string;
	category: string;
	tags: string[];
	rating: number;
	play_count: number;
	comment_count: number;
	update_time: string;
	sources: VideoSource[];
}

/** 视频来源/线路 */
export interface VideoSource {
	source_id: string;
	source_name: string;
	episodes: Episode[];
}

/** 剧集/集数 */
export interface Episode {
	episode_id: string;
	episode_name: string;
	episode_url: string; // 加密后的 m3u8 链接
}

// ========== 播放相关 ==========

/** 播放地址信息 */
export interface PlayInfo {
	url: string; // 解密后的 m3u8 地址
	quality: string;
	format: string;
}

/** 播放请求 */
export interface PlayRequest {
	video_id: string;
	episode_id: string;
	source_id: string;
}

// ========== 评论相关 ==========

/** 评论 */
export interface Comment {
	id: string;
	user_id: string;
	username: string;
	avatar: string;
	content: string;
	like_count: number;
	reply_count: number;
	create_time: string;
	replies?: Comment[];
	is_liked?: boolean;
}

/** 评论列表响应 */
export interface CommentListResponse {
	comments: Comment[];
	total: number;
	page: number;
}

/** 发表评论请求 */
export interface AddCommentRequest {
	video_id: string;
	content: string;
	parent_id?: string; // 回复的评论ID
}

// ========== 弹幕相关 ==========

/** 弹幕类型 */
export type DanmakuType = 'scroll' | 'top' | 'bottom';

/** 弹幕 */
export interface Danmaku {
	id: string;
	time: number; // 出现时间（秒）
	content: string;
	color: string;
	type: DanmakuType;
	font_size: number;
	user_id: string;
}

/** 发送弹幕请求 */
export interface SendDanmakuRequest {
	video_id: string;
	time: number;
	content: string;
	color?: string;
	type?: DanmakuType;
	font_size?: number;
}

// ========== 用户相关 ==========

/** 用户信息 */
export interface User {
	id: string;
	username: string;
	avatar: string;
	email: string;
	vip_level: number;
	create_time: string;
}

/** 登录请求 */
export interface LoginRequest {
	username: string;
	password: string;
}

/** 注册请求 */
export interface RegisterRequest {
	username: string;
	password: string;
	email: string;
}

/** 登录响应 */
export interface LoginResponse {
	token: string;
	user: User;
}

/** 更新用户信息请求 */
export interface UpdateUserRequest {
	username?: string;
	avatar?: string;
	email?: string;
}

// ========== 搜索相关 ==========

/** 搜索结果 */
export interface SearchResult {
	videos: Video[];
	total: number;
	page: number;
}

/** 搜索请求 */
export interface SearchRequest extends PaginationParams {
	keyword: string;
	filters?: {
		category?: string;
		year?: number;
		area?: string;
	};
}

/** 热搜词 */
export interface HotWord {
	word: string;
	hot: number;
}

// ========== 分类相关 ==========

/** 分类 */
export interface Category {
	slug: string;
	name: string;
	icon?: string;
	count: number;
}

/** 分类视频请求 */
export interface CategoryVideosRequest extends PaginationParams {
	slug: string;
}

// ========== 排行相关 ==========

/** 排行榜项 */
export interface RankItem {
	rank: number;
	video: Video;
	change: 'up' | 'down' | 'same';
	change_value: number;
}

/** 排行榜类型 */
export type RankType = 'daily' | 'weekly' | 'monthly' | 'all';

// ========== 观看历史 ==========

/** 观看历史记录 */
export interface WatchHistory {
	id: string;
	video_id: string;
	video_title: string;
	video_cover: string;
	episode_name: string;
	progress: number; // 播放进度（秒）
	duration: number; // 总时长（秒）
	watch_time: string;
}

/** 添加历史记录请求 */
export interface AddHistoryRequest {
	video_id: string;
	episode_id: string;
	progress: number;
	duration: number;
}

// ========== 轮播图 ==========

/** 轮播图项 */
export interface Banner {
	id: string;
	video_id: string;
	title: string;
	cover: string;
	description: string;
	link: string;
}

// ========== API 域名配置 ==========

/** API 域名信息 */
export interface ApiDomain {
	url: string;
	name: string;
	alive: boolean;
	latency: number;
}

// ========== 应用状态 ==========

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** 应用设置 */
export interface AppSettings {
	theme: ThemeMode;
	autoplay: boolean;
	danmakuEnabled: boolean;
	danmakuOpacity: number;
	danmakuFontSize: number;
	volume: number;
}

// ========== 类型守卫 ==========

/**
 * 检查是否为有效的 API 响应
 */
export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'code' in obj &&
		typeof (obj as ApiResponse<T>).code === 'number' &&
		'message' in obj &&
		typeof (obj as ApiResponse<T>).message === 'string' &&
		'data' in obj
	);
}

/**
 * 检查是否为有效的视频对象
 */
export function isVideo(obj: unknown): obj is Video {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		'title' in obj &&
		'cover' in obj &&
		'sources' in obj &&
		Array.isArray((obj as Video).sources)
	);
}

/**
 * 检查是否为有效的用户对象
 */
export function isUser(obj: unknown): obj is User {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		'username' in obj &&
		'avatar' in obj
	);
}

/**
 * 检查是否为有效的分页数据
 */
export function isPaginatedData<T>(obj: unknown): obj is PaginatedData<T> {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'list' in obj &&
		Array.isArray((obj as PaginatedData<T>).list) &&
		'total' in obj &&
		typeof (obj as PaginatedData<T>).total === 'number' &&
		'page' in obj &&
		typeof (obj as PaginatedData<T>).page === 'number'
	);
}

/**
 * 检查 API 响应是否成功
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): boolean {
	return response.code === ApiCode.SUCCESS;
}

// ========== 工具类型 ==========

/** 可空类型 */
export type Nullable<T> = T | null;

/** 可选类型 */
export type Optional<T> = T | undefined;

/** 深度只读类型 */
export type DeepReadonly<T> = {
	readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/** API 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/** 排序方向 */
export type SortOrder = 'asc' | 'desc';

/** 排序参数 */
export interface SortParams {
	field: string;
	order: SortOrder;
}

// ========== 标签相关 ==========

/** 标签信息 */
export interface Tag {
	slug: string;
	name: string;
	description?: string;
	video_count: number;
	cover?: string;
}

/** 标签列表请求 */
export interface TagListRequest extends PaginationParams {
	keyword?: string;
	sort?: 'popular' | 'latest' | 'name';
}

/** 标签视频请求 */
export interface TagVideosRequest extends PaginationParams {
	slug: string;
}

// ========== 短视频相关 ==========

/** 短视频信息 */
export interface ShortVideo {
	id: string;
	title: string;
	cover: string;
	preview_url?: string;
	description: string;
	duration: number; // 秒
	play_count: number;
	like_count: number;
	share_count: number;
	comment_count: number;
	tags: string[];
	author: {
		id: string;
		username: string;
		avatar: string;
	};
	create_time: string;
	video_url: string; // 播放地址
}

/** 短视频排序类型 */
export type ShortSortType = 'popular' | 'latest' | 'random';

/** 短视频列表请求 */
export interface ShortListRequest extends PaginationParams {
	sort?: ShortSortType;
	tag?: string;
}

// ========== 推荐相关 ==========

/** 推荐视频 */
export interface RecommendVideo {
	id: string;
	title: string;
	cover: string;
	preview_url?: string;
	play_count: number;
	rating: number;
	tags: string[];
	reason?: string; // 推荐理由
}

/** 推荐列表请求 */
export interface RecommendRequest extends PaginationParams {
	video_id: string;
}

// ========== 分享相关 ==========

/** 分享链接 */
export interface ShareLink {
	id: string;
	url: string;
	qrcode_url?: string;
	share_count: number;
	unlock_count: number;
	max_unlock: number;
	is_unlocked: boolean;
}

/** 分享解锁请求 */
export interface ShareUnlockRequest {
	video_id: string;
	platform?: 'twitter' | 'telegram' | 'link';
}

/** 金币余额 */
export interface CoinBalance {
	amount: number;
	frozen_amount: number;
	total_earned: number;
	total_spent: number;
}

/** 金币明细 */
export interface CoinRecord {
	id: string;
	type: 'earn' | 'spend' | 'freeze' | 'unfreeze';
	amount: number;
	reason: string;
	create_time: string;
}

/** 金币明细请求 */
export interface CoinRecordRequest extends PaginationParams {
	type?: 'earn' | 'spend' | 'all';
}

// ========== 设备相关 ==========

/** 设备信息 */
export interface DeviceProfile {
	device_id: string;
	platform: 'ios' | 'android' | 'web' | 'tablet';
	os_version: string;
	app_version: string;
	screen_width: number;
	screen_height: number;
	network_type: 'wifi' | '4g' | '5g' | '3g' | 'unknown';
}

// ========== 播放线路相关 ==========

/** 播放线路 */
export interface PlayLine {
	source_name: string;
	m3u8_url: string;
	domain?: string;
	path?: string;
	format?: string;
	quality?: string;   // 1080P/720P/480P
	language?: string;  // 国语/粤语/英语
}

/** 视频详情（增强版） */
export interface VideoDetail extends Video {
	clean_title: string;
	play_lines: PlayLine[];
	domain_pool?: string[];
	shared_path?: string;
	source_count: number;
}

/** 播放器状态 */
export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'switching';

/** 播放器回调 */
export interface PlayerCallbacks {
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onError?: (error: string) => void;
	onLineChange?: (index: number) => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// ========== 播放线路延迟 ==========

/** 线路延迟信息 */
export interface SourceLatency {
	source_id: string;
	latency: number; // 毫秒
	is_recommended: boolean;
}

/** 播放器事件回调（旧版，保留兼容） */
export interface PlayerCallbacksLegacy {
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onError?: (error: string) => void;
	onTimeUpdate?: (currentTime: number, duration: number) => void;
}

// ========== P2P 相关 ==========

/** P2P 节点信息 */
export interface Peer {
	peer_id: string;
	display_name?: string;
	is_connected: boolean;
	connected_at?: string;
	last_heartbeat?: string;
	shared_videos: string[]; // 分享的视频 ID 列表
}

/** P2P 信令消息 */
export interface Signal {
	type: 'offer' | 'answer' | 'ice-candidate' | 'heartbeat' | 'request' | 'response';
	from_peer_id: string;
	to_peer_id: string;
	target_room_id?: string;
	sdp?: string;
	candidate?: RTCIceCandidateInit;
	data?: unknown;
	timestamp: string;
}

/** P2P 数据传输日志 */
export interface TransferLog {
	id: string;
	video_id: string;
	from_peer_id: string;
	to_peer_id: string;
	data_type: 'm3u8' | 'chunk' | 'metadata';
	data_size: number; // 字节
	duration: number; // 毫秒
	status: 'success' | 'failed' | 'timeout';
	create_time: string;
}

/** P2P 连接状态 */
export type P2PConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

/** P2P 数据消息 */
export interface P2PDataMessage {
	type: 'm3u8_request' | 'm3u8_response' | 'heartbeat' | 'peer_list';
	video_id?: string;
	m3u8_data?: string;
	peers?: Peer[];
	timestamp: string;
}

// ========== Push 推送相关 ==========

/** Push 订阅信息 */
export interface PushSubscriptionInfo {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
	fingerprint_id?: string;
	subscribed_at: string;
}

/** Push 通知消息 */
export interface PushNotification {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	tag?: string;
	data?: {
		url?: string;
		video_id?: string;
		type?: string;
	};
	actions?: {
		action: string;
		title: string;
		icon?: string;
	}[];
}

/** Push 权限状态 */
export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// ========== 站群相关 ==========

/** 站群域名配置 */
export interface SiteDomain {
	domain: string;
	cluster: 'A' | 'B'; // 集群分组
	is_primary: boolean; // 是否为主域名
	is_active: boolean; // 是否激活
	ssl: boolean;
	redirect_to?: string; // 重定向目标
}

/** 站群重定向规则 */
export interface RedirectRule {
	source_domain: string;
	target_domain: string;
	priority: number;
	conditions: {
		ua_pattern?: string; // UA 匹配规则
		geo_pattern?: string; // 地理位置规则
		path_pattern?: string; // 路径匹配规则
	};
	enabled: boolean;
}

/** 集群类型 */
export type ClusterType = 'A' | 'B' | 'unknown';

/** UA 检测结果 */
export interface UADetectionResult {
	is_mobile: boolean;
	is_tablet: boolean;
	is_desktop: boolean;
	is_from_social: boolean;
	social_platform?: 'twitter' | 'telegram' | 'facebook' | 'weibo' | 'wechat' | 'unknown';
	browser: {
		name: string;
		version: string;
		engine: string;
	};
	os: {
		name: string;
		version: string;
	};
	device: {
		vendor?: string;
		model?: string;
		screen_width: number;
		screen_height: number;
		pixel_ratio: number;
	};
	raw_ua: string;
}

// ========== 支付相关 ==========

/** 支付渠道 */
export interface PaymentChannel {
	id: string;
	name: string;
	icon: string;
	type: 'crypto' | 'alipay' | 'wechat';
	min_amount: number;
	max_amount: number;
	is_active: boolean;
	sort_order: number;
}

/** 支付订单 */
export interface PaymentOrder {
	id: string;
	order_no: string;
	amount: number;
	currency: string;
	channel_id: string;
	channel_name: string;
	status: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded';
	pay_url?: string;
	qrcode_url?: string;
	expire_time: string;
	create_time: string;
	paid_time?: string;
}

/** VIP 订阅 */
export interface VIPSubscription {
	id: string;
	user_id: string;
	plan_id: string;
	plan_name: string;
	level: number;
	start_time: string;
	expire_time: string;
	is_active: boolean;
	auto_renew: boolean;
	price: number;
	currency: string;
}

/** VIP 套餐 */
export interface VIPPlan {
	id: string;
	name: string;
	level: number;
	duration_days: number;
	price: number;
	original_price: number;
	currency: string;
	description: string;
	features: string[];
	is_recommended: boolean;
}

// ========== 广告奖励相关 ==========

/** 广告任务 */
export interface AdTask {
	id: string;
	type: 'checkin' | 'watch_ad' | 'share' | 'invite';
	name: string;
	description: string;
	reward_amount: number;
	icon: string;
	is_completed: boolean;
	completed_count: number;
	max_count: number;
	reset_time?: string;
}

/** 金币交易记录 */
export interface CoinTransaction {
	id: string;
	user_id: string;
	type: 'earn' | 'spend' | 'freeze' | 'unfreeze';
	amount: number;
	balance_after: number;
	reason: string;
	source: string;
	create_time: string;
}

/** 每日任务完成情况 */
export interface DailyTaskCompletion {
	date: string;
	checkin: boolean;
	watch_ad_count: number;
	share_count: number;
	invite_count: number;
	total_coins_earned: number;
}

// ========== 域名轮询相关 ==========

/** 域名可用性 */
export interface DomainAvailability {
	domain: string;
	is_alive: boolean;
	latency: number;
	checked_at: string;
	region?: string;
}

/** 域名切换事件 */
export interface DomainSwitchEvent {
	from_domain: string;
	to_domain: string;
	reason: 'health_check' | 'manual' | 'auto_failover';
	timestamp: string;
}

// ========== WebSocket 弹幕相关 ==========

/** WebSocket 弹幕消息 */
export interface WSDanmakuMessage {
	type: 'danmaku' | 'online_count' | 'heartbeat_ack' | 'error';
	data: {
		id: string;
		video_id: string;
		time: number;
		content: string;
		color: string;
		type: DanmakuType;
		font_size: number;
		user_id: string;
		username: string;
		vip_level: number;
	} | {
		count: number;
	} | {
		message: string;
	};
	timestamp: string;
}

/** WebSocket 连接状态 */
export type WSConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// ========== P2P HLS 播放器相关 ==========

/** P2P 统计数据 */
export interface P2PStats {
	p2pDownloaded: number;     // P2P 下载量（字节）
	httpDownloaded: number;    // HTTP 下载量（字节）
	p2pPeers: number;          // P2P 节点数
	p2pSpeed: number;          // P2P 速度（字节/秒）
	httpSpeed: number;         // HTTP 速度（字节/秒）
	bufferLength: number;      // 缓冲区长度（秒）
	isP2PAvailable: boolean;   // P2P 是否可用
}

/** 资源站探活状态 */
export interface StationStatus {
	name: string;
	isAlive: boolean;
	latency: number;           // 延迟（ms）
	speed: number;             // 下载速度（KB/s）
	lastCheck: string;         // 最后检查时间
}
