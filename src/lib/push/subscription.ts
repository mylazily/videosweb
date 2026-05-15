/**
 * Push 推送订阅管理
 * 处理 Web Push API 订阅、取消订阅、权限管理
 */

import { getBaseUrl } from '$lib/apiConfig';
import { PUSH_VAPID_PUBLIC_KEY, PUSH_SUBSCRIPTION_KEY } from '$lib/constants';
import type { PushSubscriptionInfo, PushPermissionStatus } from '$lib/types';

// ========== 工具函数 ==========

/**
 * 将 VAPID 公钥从 Base64 转换为 Uint8Array
 * @param base64String Base64 编码的公钥
 * @returns Uint8Array 格式的公钥
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

// ========== 核心函数 ==========

/**
 * 检测浏览器是否支持 Push API
 * @returns 是否支持
 */
export function isPushSupported(): boolean {
	if (typeof window === 'undefined') return false;
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * 获取当前推送权限状态
 * @returns 权限状态
 */
export function getPushPermissionStatus(): PushPermissionStatus {
	if (!isPushSupported()) return 'unsupported';
	return Notification.permission as PushPermissionStatus;
}

/**
 * 请求通知权限
 * @returns 用户是否授权
 */
export async function requestNotificationPermission(): Promise<boolean> {
	if (!isPushSupported()) {
		console.warn('[Push] 浏览器不支持 Push API');
		return false;
	}

	if (Notification.permission === 'granted') {
		return true;
	}

	if (Notification.permission === 'denied') {
		console.warn('[Push] 用户已拒绝通知权限');
		return false;
	}

	// 请求权限
	const permission = await Notification.requestPermission();
	return permission === 'granted';
}

/**
 * 订阅 Push 推送
 * @param fingerprintId 设备指纹 ID（可选）
 * @returns 订阅信息
 */
export async function subscribePush(fingerprintId?: string): Promise<PushSubscriptionInfo | null> {
	if (!isPushSupported()) {
		console.warn('[Push] 浏览器不支持 Push API');
		return null;
	}

	// 确保有通知权限
	const hasPermission = await requestNotificationPermission();
	if (!hasPermission) {
		console.warn('[Push] 无通知权限，无法订阅');
		return null;
	}

	try {
		// 获取 Service Worker 注册
		const registration = await navigator.serviceWorker.ready;

		// 订阅 Push
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY)
		});

		// 构建订阅信息
		const subInfo: PushSubscriptionInfo = {
			endpoint: subscription.endpoint,
			keys: {
				p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
				auth: arrayBufferToBase64(subscription.getKey('auth')!)
			},
			fingerprint_id: fingerprintId,
			subscribed_at: new Date().toISOString()
		};

		// 发送到后端保存
		const base = getBaseUrl();
		const response = await fetch(`${base}/api/v1/push/subscribe`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(subInfo)
		});

		if (!response.ok) {
			throw new Error(`订阅保存失败: ${response.status}`);
		}

		// 保存订阅状态到 localStorage
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subInfo));
			} catch {
				// localStorage 不可用时静默处理
			}
		}

		console.log('[Push] 订阅成功');
		return subInfo;
	} catch (error) {
		console.error('[Push] 订阅失败:', error);
		return null;
	}
}

/**
 * 取消 Push 订阅
 * @returns 是否取消成功
 */
export async function unsubscribePush(): Promise<boolean> {
	if (!isPushSupported()) return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			console.log('[Push] 当前无活跃订阅');
			return true;
		}

		// 通知后端删除订阅
		const base = getBaseUrl();
		try {
			await fetch(`${base}/api/v1/push/unsubscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ endpoint: subscription.endpoint })
			});
		} catch {
			// 后端通知失败不影响前端取消
		}

		// 取消订阅
		await subscription.unsubscribe();

		// 清除 localStorage
		if (typeof window !== 'undefined') {
			try {
				localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
			} catch {
				// 忽略
			}
		}

		console.log('[Push] 已取消订阅');
		return true;
	} catch (error) {
		console.error('[Push] 取消订阅失败:', error);
		return false;
	}
}

/**
 * 检查是否已订阅
 * @returns 是否已订阅
 */
export async function isSubscribed(): Promise<boolean> {
	if (!isPushSupported()) return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return !!subscription;
	} catch {
		return false;
	}
}

/**
 * 获取当前订阅信息（从 localStorage）
 * @returns 订阅信息或 null
 */
export function getStoredSubscription(): PushSubscriptionInfo | null {
	if (typeof window === 'undefined') return null;

	try {
		const data = localStorage.getItem(PUSH_SUBSCRIPTION_KEY);
		if (!data) return null;
		return JSON.parse(data) as PushSubscriptionInfo;
	} catch {
		return null;
	}
}

// ========== 内部工具 ==========

/**
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
