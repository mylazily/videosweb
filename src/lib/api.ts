/**
 * API 请求封装
 * 与后端 VideosGo (9901.555554.xyz) 对接
 */

import { API_PATHS, API_TIMEOUT, API_BASE_URL, FALLBACK_DOMAINS } from '$lib/constants';
import { getToken, setToken, clearTokens } from '$lib/auth';
import { getBaseUrl } from '$lib/stores/apiConfigStore';

export interface ApiResponse<T = unknown> {
	code: number;
	message: string;
	data: T;
}

// ========== 域名管理 ==========

let currentDomainIndex = 0;

function getAvailableDomains(): string[] {
	return [API_BASE_URL, ...FALLBACK_DOMAINS.filter(d => d !== API_BASE_URL)];
}

function getCurrentDomain(): string {
	const domains = getAvailableDomains();
	return domains[currentDomainIndex % domains.length];
}

function switchToNextDomain(): void {
	currentDomainIndex++;
}

// ========== 请求拦截器 ==========

async function requestInterceptor(config: RequestInit): Promise<RequestInit> {
	const token = getToken();
	if (token) {
		config.headers = new Headers(config.headers);
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
}

// ========== 响应拦截器 ==========

interface RetryState {
	attempts: number;
	maxAttempts: number;
}

async function responseInterceptor<T>(response: Response, retryState?: RetryState): Promise<ApiResponse<T>> {
	const data = await response.json() as ApiResponse<T>;

	// 401 未授权
	if (response.status === 401) {
		if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
			clearTokens();
			window.location.href = '/login';
		}
		throw new Error('登录已过期');
	}

	// 5xx 服务器错误，尝试备用域名
	if (response.status >= 500 && retryState && retryState.attempts < retryState.maxAttempts) {
		switchToNextDomain();
		retryState.attempts++;
		throw { retry: true, state: retryState };
	}

	return data;
}

// ========== 核心请求函数 ==========

async function request<T = unknown>(
	path: string,
	options: RequestInit = {}
): Promise<ApiResponse<T>> {
	const baseUrl = getBaseUrl() || getCurrentDomain();
	const url = `${baseUrl}${path}`;

	let config: RequestInit = {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	};

	// 添加认证 token
	config = await requestInterceptor(config);

	// 添加超时
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
	config.signal = controller.signal;

	const retryState: RetryState = { attempts: 0, maxAttempts: 2 };

	while (true) {
		try {
			const response = await fetch(url, config);
			clearTimeout(timeoutId);

			const result = await responseInterceptor<T>(response, retryState);
			return result;
		} catch (error: unknown) {
			clearTimeout(timeoutId);

			// 检查是否需要重试
			if (error && typeof error === 'object' && 'retry' in error) {
				const retryError = error as { retry: boolean; state: RetryState };
				if (retryError.retry && retryError.state.attempts < retryError.state.maxAttempts) {
					continue;
				}
			}

			// 网络错误
			if (error instanceof TypeError && error.name === 'AbortError') {
				throw new Error('请求超时，请稍后重试');
			}
			throw error;
		}
	}
}

// ========== 便捷方法 ==========

export async function get<T = unknown>(
	path: string,
	params?: Record<string, string | number>
): Promise<ApiResponse<T>> {
	let queryString = '';
	if (params) {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			searchParams.set(key, String(value));
		}
		queryString = `?${searchParams.toString()}`;
	}
	return request<T>(`${path}${queryString}`);
}

export async function post<T = unknown>(
	path: string,
	data?: unknown
): Promise<ApiResponse<T>> {
	return request<T>(path, {
		method: 'POST',
		body: data ? JSON.stringify(data) : undefined,
	});
}

export async function put<T = unknown>(
	path: string,
	data?: unknown
): Promise<ApiResponse<T>> {
	return request<T>(path, {
		method: 'PUT',
		body: data ? JSON.stringify(data) : undefined,
	});
}

export async function del<T = unknown>(
	path: string,
	data?: unknown
): Promise<ApiResponse<T>> {
	return request<T>(path, {
		method: 'DELETE',
		body: data ? JSON.stringify(data) : undefined,
	});
}

// ========== 认证相关 ==========

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
	user: {
		id: string;
		username: string;
		email: string;
		avatar?: string;
		role: string;
	};
}

export const login = (data: LoginRequest) =>
	post<LoginResponse>(API_PATHS.USER_LOGIN, data);

export const register = (data: LoginRequest) =>
	post<LoginResponse>(API_PATHS.USER_REGISTER, data);

// ========== 用户相关 ==========

export const getUserProfile = () =>
	get<LoginResponse['user']>(API_PATHS.USER_PROFILE);

// ========== 视频相关 ==========

export interface Video {
	id: string;
	title: string;
	cover: string;
	play_url?: string;
	description?: string;
	view_count?: number;
	like_count?: number;
	favorite_count?: number;
	comment_count?: number;
	duration?: number;
	category?: string;
	tags?: string[];
	created_at?: string;
	updated_at?: string;
}

export interface VideoListResponse {
	list: Video[];
	page: number;
	page_size: number;
}

export const getVideoList = (params?: { page?: number; page_size?: number; category?: string }) =>
	get<VideoListResponse>(API_PATHS.VIDEO_LIST, params as Record<string, string | number>);

export const getVideoDetail = (id: string) =>
	get<Video>(`${API_PATHS.VIDEO_DETAIL}/${id}`);

// ========== 评论相关 ==========

export interface Comment {
	id: string;
	video_id: string;
	user_id: string;
	user?: {
		id: string;
		username: string;
		avatar?: string;
	};
	content: string;
	like_count: number;
	parent_id?: string;
	reply_count?: number;
	created_at: string;
	updated_at?: string;
}

export interface CommentListResponse {
	list: Comment[];
	total: number;
	page: number;
	page_size: number;
}

export const getCommentList = (videoId: string, params?: { page?: number; page_size?: number }) =>
	get<CommentListResponse>(`${API_PATHS.VIDEO_LIST}/${videoId}/comments`, params as Record<string, string | number>);

export const addComment = (videoId: string, data: { content: string; parent_id?: string }) =>
	post<Comment>(`${API_PATHS.VIDEO_LIST}/${videoId}/comments`, data);

export const getCommentReplies = (commentId: string) =>
	get<Comment[]>(`${API_PATHS.COMMENT_REPLIES}/${commentId}/replies`);

// ========== 弹幕相关 ==========

export interface Danmaku {
	id: string;
	video_id: string;
	episode_id?: string;
	time: string;
	type: string;
	color: string;
	content: string;
	user_id?: string;
	created_at: string;
}

export const getDanmakuList = (videoId: string) =>
	get<Danmaku[]>(`${API_PATHS.DANMAKU_LIST}/${videoId}/danmaku`);

export const getEpisodeDanmaku = (videoId: string, episodeId: string) =>
	get<Danmaku[]>(`${API_PATHS.DANMAKU_EPISODE}/${videoId}/episodes/${episodeId}/danmaku`);

// ========== 标签相关 ==========

export interface Tag {
	id: string;
	name: string;
	slug: string;
	video_count: number;
	description?: string;
	created_at: string;
}

export const getTagList = (params?: { page?: number; page_size?: number; sort?: string }) =>
	get<{ list: Tag[]; total: number }>(API_PATHS.TAG_LIST, params as Record<string, string | number>);

export const getTagDetail = (slug: string) =>
	get<Tag>(`${API_PATHS.TAG_DETAIL}/${slug}`);

export const getTagVideos = (slug: string, params?: { page?: number; page_size?: number }) =>
	get<VideoListResponse>(`${API_PATHS.TAG_VIDEOS}/${slug}/videos`, params as Record<string, string | number>);

// ========== 排行榜相关 ==========

export interface RankItem {
	id: string;
	video_id: string;
	video?: Video;
	score: number;
	type: string;
	period_date: string;
	created_at: string;
}

export const getDailyRank = (params?: { limit?: number }) =>
	get<RankItem[]>(API_PATHS.RANK_DAILY, params as Record<string, string | number>);

export const getWeeklyRank = (params?: { limit?: number }) =>
	get<RankItem[]>(API_PATHS.RANK_WEEKLY, params as Record<string, string | number>);

export const getMonthlyRank = (params?: { limit?: number }) =>
	get<RankItem[]>(API_PATHS.RANK_MONTHLY, params as Record<string, string | number>);

// ========== 健康检查 ==========

export const healthCheck = () =>
	get<{ status: string; service: string; version: string }>(API_PATHS.HEALTH);

// ========== 导出类型 ==========

export type { Video, Comment, Tag, RankItem, LoginResponse, LoginRequest, ApiResponse };
