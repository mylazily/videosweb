/**
 * API 请求封装
 * 基于 fetch 的请求封装，自动附加 JWT Token
 * 统一错误处理、请求/响应拦截
 * 所有路径使用 API_PATHS 常量，与后端 router.go 严格对应
 */

import { getBaseUrl } from './apiConfig';
import { getToken, clearTokens } from './auth';
import { API_PATHS } from './constants';
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
	const headers = options.headers as Record<string, string> | undefined;
	if (!headers?.['Content-Type'] && !(options.body instanceof FormData)) {
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
 * @param path API 完整路径（如 /api/v1/videos/hot）
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
	// 如果 base 为空，使用相对路径（通过 Cloudflare Pages 代理到后端）
	const fullUrl = base ? `${base}${path}` : path;

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

// ========== 认证 API ==========

/** 用户登录 */
export function userLogin(data: { username: string; password: string }) {
	return post<{ token: string; user: import('./types').User }>(API_PATHS.USER_LOGIN, data);
}

/** 用户注册 */
export function userRegister(data: { username: string; password: string; email?: string }) {
	return post<{ token: string; user: import('./types').User }>(API_PATHS.USER_REGISTER, data);
}

/** 刷新 Token */
export function refreshToken() {
	return post<{ token: string }>(API_PATHS.AUTH_REFRESH);
}

// ========== 用户 API（需认证） ==========

/** 获取用户资料 */
export function getUserProfile() {
	return get<import('./types').User>(API_PATHS.USER_PROFILE);
}

/** 更新用户资料 */
export function updateUserProfile(data: { username?: string; avatar?: string; email?: string }) {
	return put<import('./types').User>(API_PATHS.USER_UPDATE, data);
}

/** 修改密码 */
export function changePassword(data: { old_password: string; new_password: string }) {
	return post(API_PATHS.USER_PASSWORD, data);
}

// ========== 视频 API（公开） ==========

/** 获取视频列表 */
export function getVideoList(params?: { page?: number; page_size?: number; category?: string; tag?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.category) query.set('category', params.category);
	if (params?.tag) query.set('tag', params.tag);
	const qs = query.toString();
	return get(`/api/v1/videos${qs ? `?${qs}` : ''}`);
}

/** 获取视频详情 */
export function getVideoDetail(id: string) {
	return get<import('./types').Video>(`${API_PATHS.VIDEO_DETAIL}/${id}`);
}

/** 获取热门视频 */
export function getHotVideos(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.VIDEO_HOT}${qs ? `?${qs}` : ''}`);
}

/** 获取最新视频 */
export function getLatestVideos(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.VIDEO_LATEST}${qs ? `?${qs}` : ''}`);
}

/** 获取随机视频 */
export function getRandomVideos(params?: { page_size?: number; category?: string }) {
	const query = new URLSearchParams();
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.category) query.set('category', params.category);
	const qs = query.toString();
	return get(`${API_PATHS.VIDEO_RANDOM}${qs ? `?${qs}` : ''}`);
}

/** 获取视频剧集列表 */
export function getVideoEpisodes(id: string) {
	return get(`${API_PATHS.VIDEO_EPISODES}/${id}/episodes`);
}

/** 获取视频标签 */
export function getVideoTags(id: string) {
	return get(`${API_PATHS.VIDEO_TAGS}/${id}/tags`);
}

/** 搜索视频 */
export function searchVideos(params: { keyword: string; page?: number; page_size?: number }) {
	const query = new URLSearchParams({ keyword: params.keyword });
	if (params.page) query.set('page', String(params.page));
	if (params.page_size) query.set('page_size', String(params.page_size));
	return get(`${API_PATHS.VIDEO_SEARCH}?${query.toString()}`);
}

/** 获取热门搜索词 */
export function getSearchHot() {
	return get(API_PATHS.SEARCH_HOT);
}

/** 记录观看进度（需认证） */
export function recordWatch(videoId: string, data: { progress?: number; episode_id?: string }) {
	return post(`${API_PATHS.VIDEO_WATCH}/${videoId}/watch`, data);
}

/** 获取带多线路的视频详情 */
export function getVideoWithLines(id: string) {
	return get<import('./types').VideoDetail>(`${API_PATHS.VIDEO_PLAY}/${id}/play`);
}

/** 上报线路速度 */
export function reportLineSpeed(videoId: string, lineIndex: number, speed: number) {
	return post('/api/v1/videos/line-speed', {
		video_id: videoId,
		line_index: lineIndex,
		speed
	});
}

// ========== 分类 API ==========

/** 获取分类列表 */
export function getCategories() {
	return get(API_PATHS.CATEGORY_LIST);
}

// ========== 标签 API ==========

/** 获取标签列表 */
export function getTagList(params?: { page?: number; page_size?: number; keyword?: string; sort?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.keyword) query.set('keyword', params.keyword);
	if (params?.sort) query.set('sort', params.sort);
	const qs = query.toString();
	return get(`${API_PATHS.TAG_LIST}${qs ? `?${qs}` : ''}`);
}

/** 获取标签详情 */
export function getTagDetail(slug: string) {
	return get(`${API_PATHS.TAG_DETAIL}/${slug}`);
}

/** 获取标签下的视频 */
export function getTagVideos(slug: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.TAG_VIDEOS}/${slug}/videos${qs ? `?${qs}` : ''}`);
}

// ========== 短视频 API ==========

/** 获取短视频列表 */
export function getShortList(params?: { page?: number; page_size?: number; sort?: string; tag?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.sort) query.set('sort', params.sort);
	if (params?.tag) query.set('tag', params.tag);
	const qs = query.toString();
	return get(`${API_PATHS.SHORT_LIST}${qs ? `?${qs}` : ''}`);
}

/** 获取短视频详情 */
export function getShortDetail(id: string) {
	return get(`${API_PATHS.SHORT_DETAIL}/${id}`);
}

/** 获取随机短视频 */
export function getRandomShort(params?: { page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.SHORT_RANDOM}${qs ? `?${qs}` : ''}`);
}

/** 记录短视频播放 */
export function viewShort(id: string) {
	return post(`${API_PATHS.SHORT_VIEW}/${id}/view`);
}

/** 点赞短视频 */
export function likeShort(id: string) {
	return post(`${API_PATHS.SHORT_LIKE}/${id}/like`);
}

// ========== 推荐 API ==========

/** 获取相关推荐视频 */
export function getRelatedVideos(videoId: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.VIDEO_RELATED}/${videoId}/related${qs ? `?${qs}` : ''}`);
}

/** 获取个性化推荐 */
export function getRecommendations(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.RECOMMENDATIONS}${qs ? `?${qs}` : ''}`);
}

// ========== 排行榜 API ==========

/** 获取日排行 */
export function getDailyRank(params?: { page?: number; page_size?: number; category?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.category) query.set('category', params.category);
	const qs = query.toString();
	return get(`${API_PATHS.RANK_DAILY}${qs ? `?${qs}` : ''}`);
}

/** 获取周排行 */
export function getWeeklyRank(params?: { page?: number; page_size?: number; category?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.category) query.set('category', params.category);
	const qs = query.toString();
	return get(`${API_PATHS.RANK_WEEKLY}${qs ? `?${qs}` : ''}`);
}

/** 获取月排行 */
export function getMonthlyRank(params?: { page?: number; page_size?: number; category?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.category) query.set('category', params.category);
	const qs = query.toString();
	return get(`${API_PATHS.RANK_MONTHLY}${qs ? `?${qs}` : ''}`);
}

/** 获取分类排行 */
export function getCategoryRank(category: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.RANK_CATEGORY}/${category}${qs ? `?${qs}` : ''}`);
}

// ========== 评论 API ==========

/** 获取视频评论列表 */
export function getCommentList(videoId: string, params?: { page?: number; page_size?: number; sort?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.sort) query.set('sort', params.sort);
	const qs = query.toString();
	return get(`${API_PATHS.COMMENT_LIST}/${videoId}/comments${qs ? `?${qs}` : ''}`);
}

/** 发表评论（需认证） */
export function addComment(videoId: string, data: { content: string; parent_id?: string }) {
	return post(`${API_PATHS.COMMENT_ADD}/${videoId}/comments`, data);
}

/** 删除评论（需认证） */
export function deleteComment(commentId: string) {
	return del(`${API_PATHS.COMMENT_DELETE}/${commentId}`);
}

/** 点赞评论（需认证） */
export function likeComment(commentId: string) {
	return post(`${API_PATHS.COMMENT_LIKE}/${commentId}/like`);
}

/** 取消点赞评论（需认证） */
export function unlikeComment(commentId: string) {
	return del(`${API_PATHS.COMMENT_UNLIKE}/${commentId}/like`);
}

/** 获取评论回复列表 */
export function getCommentReplies(commentId: string, params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.COMMENT_REPLIES}/${commentId}/replies${qs ? `?${qs}` : ''}`);
}

// ========== 弹幕 API ==========

/** 获取视频弹幕列表 */
export function getDanmakuList(videoId: string) {
	return get(`${API_PATHS.DANMAKU_LIST}/${videoId}/danmaku`);
}

/** 获取剧集弹幕列表 */
export function getEpisodeDanmaku(videoId: string, episodeId: string) {
	return get(`${API_PATHS.DANMAKU_EPISODE}/${videoId}/episodes/${episodeId}/danmaku`);
}

/** 发送弹幕（需认证） */
export function sendDanmaku(videoId: string, episodeId: string, data: { time: number; content: string; color?: string; type?: string }) {
	return post(`${API_PATHS.DANMAKU_SEND}/${videoId}/episodes/${episodeId}/danmaku`, data);
}

// ========== 观看历史 API（需认证） ==========

/** 获取观看历史 */
export function getWatchHistory(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.HISTORY_LIST}${qs ? `?${qs}` : ''}`);
}

// ========== 设备 API ==========

/** 注册设备信息 */
export function registerDevice(deviceInfo: Record<string, unknown>) {
	return post(API_PATHS.DEVICE_REGISTER, deviceInfo);
}

/** 获取设备画像 */
export function getDeviceProfile() {
	return get(API_PATHS.DEVICE_PROFILE);
}

/** 设备解锁视频 */
export function deviceUnlockVideo(data: { video_id: string; coin_cost?: number }) {
	return post(API_PATHS.DEVICE_UNLOCK, data);
}

/** 检查视频是否已解锁 */
export function checkVideoUnlocked(videoId: string) {
	return get(`${API_PATHS.DEVICE_CHECK}/${videoId}`);
}

// ========== 分享 API ==========

/** 创建分享链接 */
export function createShareLink(videoId: string) {
	return post<{ share: import('./types').ShareLink }>(API_PATHS.SHARE_CREATE, { video_id: videoId });
}

/** 获取分享链接信息 */
export function getShareLink(code: string) {
	return get(`${API_PATHS.SHARE_DETAIL}/${code}`);
}

/** 记录分享点击 */
export function recordShareClick(code: string, data?: { platform?: string }) {
	return post(`${API_PATHS.SHARE_CLICK}/${code}/click`, data);
}

// ========== P2P API ==========

/** 注册 P2P 节点 */
export function registerP2PPeer(peerId: string) {
	return post<{ peer: import('./types').Peer }>(API_PATHS.P2P_REGISTER, { peer_id: peerId });
}

/** P2P 心跳 */
export function p2pHeartbeat(data: { peer_id: string }) {
	return post(API_PATHS.P2P_HEARTBEAT, data);
}

/** 注销 P2P 节点 */
export function unregisterP2PPeer(data: { peer_id: string }) {
	return del(API_PATHS.P2P_UNREGISTER);
}

/** P2P Offer 信令 */
export function p2pOffer(data: { peer_id: string; target_id: string; sdp: string }) {
	return post(API_PATHS.P2P_OFFER, data);
}

/** P2P Answer 信令 */
export function p2pAnswer(data: { peer_id: string; target_id: string; sdp: string }) {
	return post(API_PATHS.P2P_ANSWER, data);
}

/** P2P ICE 候选交换 */
export function p2pICE(data: { peer_id: string; target_id: string; candidate: string }) {
	return post(API_PATHS.P2P_ICE, data);
}

/** 获取视频的 P2P 节点列表 */
export function getP2PPeers(videoId: string) {
	return get<{ peers: import('./types').Peer[] }>(`${API_PATHS.P2P_PEERS}/${videoId}`);
}

// ========== Push 推送 API ==========

/** 订阅 Push 推送 */
export function subscribePushAPI(subscription: import('./types').PushSubscriptionInfo) {
	return post(API_PATHS.PUSH_SUBSCRIBE, subscription);
}

/** 取消 Push 订阅（后端用 DELETE 方法） */
export function unsubscribePushAPI(endpoint: string) {
	return del(`${API_PATHS.PUSH_UNSUBSCRIBE}?endpoint=${encodeURIComponent(endpoint)}`);
}

/** 获取推送统计 */
export function getPushStats() {
	return get(API_PATHS.PUSH_STATS);
}

// ========== X.com API ==========

/** 获取 X 账号列表 */
export function getXAccounts() {
	return get(API_PATHS.X_ACCOUNTS);
}

/** 获取 X 帖子列表 */
export function getXPosts(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.X_POSTS}${qs ? `?${qs}` : ''}`);
}

// ========== 支付 API ==========

/** 获取支付渠道列表 */
export function getPaymentChannels() {
	return get<{ channels: import('./types').PaymentChannel[] }>(API_PATHS.PAYMENT_CHANNELS);
}

/** 获取 VIP 状态 */
export function getVIPStatus() {
	return get(API_PATHS.PAYMENT_VIP_STATUS);
}

/** 验证 VIP 支付 */
export function verifyVIPPayment(data: { order_no: string; channel: string; tx_hash?: string }) {
	return post(API_PATHS.PAYMENT_VERIFY, data);
}

// ========== 广告金币 API ==========

/** 获取每日任务列表 */
export function getDailyTasks() {
	return get<{ tasks: import('./types').AdTask[] }>(API_PATHS.REWARD_TASKS);
}

/** 获取金币余额 */
export function getRewardBalance() {
	return get<{ balance: number }>(API_PATHS.REWARD_BALANCE);
}

/** 获取金币历史 */
export function getRewardHistory(params?: { page?: number; page_size?: number; type?: string }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	if (params?.type) query.set('type', params.type);
	const qs = query.toString();
	return get(`${API_PATHS.REWARD_HISTORY}${qs ? `?${qs}` : ''}`);
}

/** 获取奖励仪表盘 */
export function getRewardDashboard() {
	return get(API_PATHS.REWARD_DASHBOARD);
}

// ========== 域名轮询 API ==========

/** 获取当前活跃域名 */
export function getActiveDomain() {
	return get(API_PATHS.DOMAIN_ACTIVE);
}

/** 获取域名列表 */
export function getDomainList() {
	return get(API_PATHS.DOMAIN_LIST);
}

/** 获取健康域名列表 */
export function getHealthyDomains() {
	return get(API_PATHS.DOMAIN_HEALTHY);
}

// ========== 资源站监控 API ==========

/** 获取资源站状态 */
export function getStationStatus() {
	return get(API_PATHS.STATION_STATUS);
}

/** 获取最佳资源站 */
export function getBestStation() {
	return get(API_PATHS.STATION_BEST);
}

/** 获取存活资源站 */
export function getAliveStations() {
	return get(API_PATHS.STATION_ALIVE);
}

// ========== 管理后台 API（需认证+管理员） ==========

/** 获取用户列表 */
export function adminListUsers(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.ADMIN_USERS}${qs ? `?${qs}` : ''}`);
}

/** 删除用户 */
export function adminDeleteUser(userId: string) {
	return del(`${API_PATHS.ADMIN_USERS}/${userId}`);
}

/** 获取采集源列表 */
export function adminListSources(params?: { page?: number; page_size?: number }) {
	const query = new URLSearchParams();
	if (params?.page) query.set('page', String(params.page));
	if (params?.page_size) query.set('page_size', String(params.page_size));
	const qs = query.toString();
	return get(`${API_PATHS.ADMIN_COLLECT_SOURCES}${qs ? `?${qs}` : ''}`);
}

/** 创建采集源 */
export function adminCreateSource(data: Record<string, unknown>) {
	return post(API_PATHS.ADMIN_COLLECT_SOURCES, data);
}

/** 获取站群列表 */
export function adminListSites() {
	return get(API_PATHS.ADMIN_SITES);
}

/** 获取重定向规则 */
export function adminListRedirects() {
	return get(API_PATHS.ADMIN_REDIRECTS);
}

/** 发送推送通知 */
export function adminSendPush(data: { title: string; body: string; url?: string }) {
	return post(API_PATHS.ADMIN_PUSH_SEND, data);
}

/** 创建支付订单（管理） */
export function adminCreatePaymentOrder(data: { channel_id: string; plan_id?: string; amount?: number; user_id?: string }) {
	return post(API_PATHS.ADMIN_PAYMENT_CREATE, data);
}

/** 管理员完成奖励任务 */
export function adminCompleteReward(data: { user_id: string; task_id: string }) {
	return post(API_PATHS.ADMIN_REWARD_COMPLETE, data);
}

/** 管理员解锁视频 */
export function adminUnlockVideo(data: { user_id: string; video_id: string }) {
	return post(API_PATHS.ADMIN_REWARD_UNLOCK, data);
}

/** 管理员签到 */
export function adminDailyCheckin(data: { user_id: string }) {
	return post(API_PATHS.ADMIN_REWARD_CHECKIN, data);
}
