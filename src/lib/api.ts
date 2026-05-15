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

// ========== P2P API ==========

/**
 * 注册 P2P 节点
 */
export function registerP2PPeer(peerId: string) {
	return post<{ peer: import('./types').Peer }>('/api/v1/p2p/register', { peer_id: peerId });
}

/**
 * 获取 P2P 房间内的节点列表
 */
export function getP2PRoomPeers(roomId: string) {
	return get<{ peers: import('./types').Peer[] }>(`/api/v1/p2p/room/peers?room_id=${encodeURIComponent(roomId)}`);
}

/**
 * 上报 P2P 传输日志
 */
export function reportP2PTransfer(log: Omit<import('./types').TransferLog, 'id' | 'create_time'>) {
	return post('/api/v1/p2p/transfer/log', log);
}

/**
 * 获取 P2P 节点统计信息
 */
export function getP2PStats() {
	return get<{ total_peers: number; active_connections: number; total_transfers: number }>('/api/v1/p2p/stats');
}

// ========== Push 推送 API ==========

/**
 * 订阅 Push 推送
 */
export function subscribePushAPI(subscription: import('./types').PushSubscriptionInfo) {
	return post('/api/v1/push/subscribe', subscription);
}

/**
 * 取消 Push 订阅
 */
export function unsubscribePushAPI(endpoint: string) {
	return post('/api/v1/push/unsubscribe', { endpoint });
}

/**
 * 获取推送历史记录
 */
export function getPushHistory(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`/api/v1/push/history${qs ? `?${qs}` : ''}`);
}

// ========== 站群管理 API ==========

/**
 * 获取站群域名列表
 */
export function getClusterDomains() {
	return get<{ domains: import('./types').SiteDomain[] }>('/api/v1/cluster/domains');
}

/**
 * 获取站群重定向规则
 */
export function getRedirectRules() {
	return get<{ rules: import('./types').RedirectRule[] }>('/api/v1/cluster/redirects');
}

/**
 * 上报站点访问信息
 */
export function reportSiteVisit(data: { domain: string; path: string; ua?: string; referrer?: string }) {
	return post('/api/v1/cluster/visit', data);
}

// ========== TG Mini App API ==========

/**
 * 发送 TG Mini App 会话数据到后端
 */
export function sendTGSession(session: import('./types').TGSession) {
	return post('/api/v1/tg/session', session);
}

/**
 * TG 用户登录/注册
 */
export function tgLogin(initData: string) {
	return post<{ token: string; user: import('./types').User }>('/api/v1/tg/login', { init_data: initData });
}

/**
 * 绑定 TG 账号
 */
export function bindTGAccount(tgUserId: number) {
	return post('/api/v1/tg/bind', { tg_user_id: tgUserId });
}

// ========== 支付 API ==========

/**
 * 获取支付渠道列表
 */
export function getPaymentChannels() {
	return get<{ channels: import('./types').PaymentChannel[] }>('/api/v1/payment/channels');
}

/**
 * 创建支付订单
 */
export function createPaymentOrder(data: {
	channel_id: string;
	plan_id?: string;
	amount?: number;
	video_id?: string;
}) {
	return post<{ order: import('./types').PaymentOrder }>('/api/v1/payment/create', data);
}

/**
 * 查询支付订单状态
 */
export function getPaymentOrderStatus(orderNo: string) {
	return get<{ order: import('./types').PaymentOrder }>(`/api/v1/payment/status?order_no=${encodeURIComponent(orderNo)}`);
}

/**
 * 获取 VIP 套餐列表
 */
export function getVIPPlans() {
	return get<{ plans: import('./types').VIPPlan[] }>('/api/v1/payment/vip/plans');
}

/**
 * 获取当前 VIP 订阅信息
 */
export function getVIPSubscription() {
	return get<{ subscription: import('./types').VIPSubscription | null }>('/api/v1/payment/vip/subscription');
}

// ========== 广告奖励 API ==========

/**
 * 获取每日任务列表
 */
export function getDailyTasks() {
	return get<{ tasks: import('./types').AdTask[] }>('/api/v1/reward/tasks');
}

/**
 * 签到
 */
export function dailyCheckin() {
	return post<{ reward: number; total_days: number }>('/api/v1/reward/checkin');
}

/**
 * 上报广告观看完成
 */
export function reportAdWatch(adId: string) {
	return post<{ reward: number }>('/api/v1/reward/ad/watch', { ad_id: adId });
}

/**
 * 获取金币流水
 */
export function getCoinTransactions(params?: { page?: number; page_size?: number; type?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.type) query.set('type', params.type);
	const qs = query.toString();
	return get<{ transactions: import('./types').CoinTransaction[]; total: number }>(`/api/v1/reward/transactions${qs ? `?${qs}` : ''}`);
}

/**
 * 获取每日任务完成情况
 */
export function getDailyTaskCompletion() {
	return get<{ completion: import('./types').DailyTaskCompletion }>('/api/v1/reward/daily/completion');
}

/**
 * 金币解锁视频
 */
export function coinUnlockVideo(videoId: string) {
	return post<{ success: boolean; balance_after: number }>('/api/v1/reward/unlock', { video_id: videoId });
}

// ========== 视频详情 API ==========

/**
 * 获取视频详情（基础版）
 */
export function getVideoDetail(id: string) {
	return get<import('./types').Video>(`/api/v1/videos/${id}`);
}

/**
 * 获取带多线路的视频详情（增强版）
 * 返回 VideoDetail，包含 play_lines、domain_pool、shared_path
 */
export function getVideoWithLines(id: string) {
	return get<import('./types').VideoDetail>(`/api/v1/videos/${id}/play`);
}

/**
 * 上报线路速度
 * @param videoId 视频 ID
 * @param lineIndex 线路索引
 * @param speed 下载速度（bytes/s）
 */
export function reportLineSpeed(videoId: string, lineIndex: number, speed: number) {
	return post('/api/v1/videos/line-speed', {
		video_id: videoId,
		line_index: lineIndex,
		speed
	});
}

// ========== 域名轮询 API ==========

/**
 * 获取域名可用性列表
 */
export function getDomainAvailability() {
	return get<{ domains: import('./types').DomainAvailability[] }>('/api/v1/domain/availability');
}

/**
 * 上报域名切换事件
 */
export function reportDomainSwitch(event: import('./types').DomainSwitchEvent) {
	return post('/api/v1/domain/switch', event);
}
