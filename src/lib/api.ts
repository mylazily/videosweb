/**
 * API 请求封装
 * 基于 fetch 的请求封装，自动附加 JWT Token
 * 统一错误处理、请求/响应拦截
 */

import { getBaseUrl } from './apiConfig';
import { getToken, clearTokens } from './auth';
import type { ApiResponse } from './types';

// ========== 请求配置 ==========

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: unknown;
	headers?: Record<string, string>;
	timeout?: number;
	isFormData?: boolean;
}

// ========== 请求拦截器 ==========

/** 请求拦截器：在请求发出前处理 */
function requestInterceptor(url: string, options: RequestInit): { url: string; options: RequestInit } {
	// 自动附加 Token
	const token = getToken();
	if (token) {
		options.headers = {
			...options.headers,
			'Authorization': `Bearer ${token}`
		};
	}

	// 设置默认 Content-Type
	if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
		options.headers = {
			...options.headers,
			'Content-Type': 'application/json'
		};
	}

	return { url, options };
}

// ========== 响应拦截器 ==========

/** 响应拦截器：在响应返回后处理 */
async function responseInterceptor<T>(response: Response): Promise<ApiResponse<T>> {
	// 处理 401 未授权
	if (response.status === 401) {
		clearTokens();
		// 跳转到登录页
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw new Error('登录已过期，请重新登录');
	}

	// 处理非 200 响应
	if (!response.ok) {
		const errorText = await response.text().catch(() => '请求失败');
		let errorMessage = '网络请求失败';
		try {
			const errorData = JSON.parse(errorText);
			errorMessage = errorData.message || errorMessage;
		} catch {
			errorMessage = errorText || errorMessage;
		}
		throw new Error(errorMessage);
	}

	// 解析 JSON 响应
	const data = await response.json();
	return data as ApiResponse<T>;
}

// ========== 核心请求函数 ==========

/**
 * 通用请求函数
 * @param path API 路径（如 /api/video/list）
 * @param options 请求选项
 * @returns API 响应数据
 */
export async function request<T = unknown>(
	path: string,
	options: RequestOptions = {}
): Promise<ApiResponse<T>> {
	const {
		method = 'GET',
		body,
		headers = {},
		timeout = 15000,
		isFormData = false
	} = options;

	// 构建完整 URL
	const base = getBaseUrl();
	const fullUrl = `${base}${path}`;

	// 构建请求参数
	const fetchOptions: RequestInit = {
		method,
		headers: {
			...headers
		}
	};

	// 处理请求体
	if (body && method !== 'GET') {
		fetchOptions.body = isFormData ? (body as FormData) : JSON.stringify(body);
	}

	// 请求拦截
	const intercepted = requestInterceptor(fullUrl, fetchOptions);

	// 带超时的请求
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(intercepted.url, {
			...intercepted.options,
			signal: controller.signal
		});

		clearTimeout(timer);
		return await responseInterceptor<T>(response);
	} catch (error) {
		clearTimeout(timer);

		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('请求超时，请稍后重试');
		}

		if (error instanceof TypeError) {
			// 网络错误，可能是域名不可用
			throw new Error('网络连接失败，正在切换线路...');
		}

		throw error;
	}
}

// ========== 便捷方法 ==========

/** GET 请求 */
export function get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
	return request<T>(path, { ...options, method: 'GET' });
}

/** POST 请求 */
export function post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
	return request<T>(path, { ...options, method: 'POST', body });
}

/** PUT 请求 */
export function put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
	return request<T>(path, { ...options, method: 'PUT', body });
}

/** DELETE 请求 */
export function del<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
	return request<T>(path, { ...options, method: 'DELETE' });
}

// ========== 文件上传 ==========

/**
 * 上传文件
 * @param path 上传路径
 * @param file 文件对象
 * @param fieldName 字段名
 */
export function upload<T = unknown>(
	path: string,
	file: File,
	fieldName: string = 'file'
): Promise<ApiResponse<T>> {
	const formData = new FormData();
	formData.append(fieldName, file);
	return request<T>(path, {
		method: 'POST',
		body: formData,
		isFormData: true,
		timeout: 60000
	});
}

// ========== 短视频 API ==========

/**
 * 获取短视频列表
 */
export function getShortList(params?: { page?: number; page_size?: number; sort?: string; tag?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.sort) query.set('sort', params.sort);
	if (params?.tag) query.set('tag', params.tag);
	const qs = query.toString();
	return get(`/api/v1/shorts${qs ? `?${qs}` : ''}`);
}

/**
 * 获取短视频详情
 */
export function getShortDetail(id: string) {
	return get(`/api/v1/shorts/${id}`);
}

/**
 * 点赞短视频
 */
export function likeShort(id: string) {
	return post(`/api/v1/shorts/${id}/like`);
}

// ========== 标签 API ==========

/**
 * 获取标签列表
 */
export function getTagList(params?: { page?: number; page_size?: number; keyword?: string; sort?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.keyword) query.set('keyword', params.keyword);
	if (params?.sort) query.set('sort', params.sort);
	const qs = query.toString();
	return get(`/api/v1/tags${qs ? `?${qs}` : ''}`);
}

/**
 * 获取标签详情
 */
export function getTagDetail(slug: string) {
	return get(`/api/v1/tags/${slug}`);
}

/**
 * 获取标签下的视频
 */
export function getTagVideos(slug: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`/api/v1/tags/${slug}/videos${qs ? `?${qs}` : ''}`);
}

// ========== 推荐 API ==========

/**
 * 获取相关推荐视频
 */
export function getRelatedVideos(videoId: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`/api/v1/videos/${videoId}/related${qs ? `?${qs}` : ''}`);
}

// ========== 分享 API ==========

/**
 * 创建分享链接
 */
export function createShareLink(videoId: string) {
	return post<{ share: import('./types').ShareLink }>('/api/v1/share/create', { video_id: videoId });
}

/**
 * 分享解锁
 */
export function shareUnlock(data: { share_id: string; platform?: string }) {
	return post('/api/v1/share/unlock', data);
}

// ========== 金币 API ==========

/**
 * 获取金币余额
 */
export function getCoinBalance() {
	return get<{ balance: import('./types').CoinBalance }>('/api/v1/coin/balance');
}

/**
 * 获取金币明细
 */
export function getCoinRecords(params?: { page?: number; page_size?: number; type?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.type) query.set('type', params.type);
	const qs = query.toString();
	return get(`/api/v1/coin/records${qs ? `?${qs}` : ''}`);
}

// ========== 设备 API ==========

/**
 * 注册设备信息
 */
export function registerDevice(deviceInfo: Record<string, unknown>) {
	return post('/api/v1/device/register', deviceInfo);
}
