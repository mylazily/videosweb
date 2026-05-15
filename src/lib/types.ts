/**
 * TypeScript 类型定义
 * XVideos 影视聚合系统
 */

// ========== 通用响应 ==========

/** API 统一响应结构 */
export interface ApiResponse<T = unknown> {
	code: number;
	message: string;
	data: T;
}

/** 分页数据 */
export interface PaginatedData<T> {
	list: T[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
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

// ========== 弹幕相关 ==========

/** 弹幕 */
export interface Danmaku {
	id: string;
	time: number; // 出现时间（秒）
	content: string;
	color: string;
	type: 'scroll' | 'top' | 'bottom';
	font_size: number;
	user_id: string;
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

// ========== 搜索相关 ==========

/** 搜索结果 */
export interface SearchResult {
	videos: Video[];
	total: number;
	page: number;
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

// ========== 排行相关 ==========

/** 排行榜项 */
export interface RankItem {
	rank: number;
	video: Video;
	change: 'up' | 'down' | 'same';
	change_value: number;
}

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
