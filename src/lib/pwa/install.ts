/**
 * PWA 安装引导管理
 * 监听 beforeinstallprompt 事件，提供安装/取消安装功能
 */

import { PWA_INSTALL_DISMISSED_KEY } from '$lib/constants';

// ========== 类型定义 ==========

/** 安装事件（扩展标准接口） */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ========== 状态管理 ==========

/** 缓存的安装提示事件 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

/** 是否已初始化 */
let initialized = false;

// ========== 核心函数 ==========

/**
 * 初始化 PWA 安装监听
 * 应在应用启动时调用（如 layout.ts 或 onMount 中）
 */
export function initPWAInstall(): void {
	if (initialized || typeof window === 'undefined') return;
	initialized = true;

	window.addEventListener('beforeinstallprompt', (e: Event) => {
		// 阻止默认的安装提示
		e.preventDefault();
		deferredPrompt = e as BeforeInstallPromptEvent;
		console.log('[PWA] 捕获到安装提示事件');
	});

	// 监听安装完成事件
	window.addEventListener('appinstalled', () => {
		deferredPrompt = null;
		console.log('[PWA] 应用已安装');
	});
}

/**
 * 检测是否可以安装 PWA
 * @returns 是否可以安装
 */
export function canInstall(): boolean {
	return !!deferredPrompt;
}

/**
 * 触发 PWA 安装提示
 * @returns 用户是否接受安装
 */
export async function promptInstall(): Promise<boolean> {
	if (!deferredPrompt) {
		console.warn('[PWA] 无可用的安装提示');
		return false;
	}

	try {
		// 显示安装提示
		await deferredPrompt.prompt();

		// 等待用户选择
		const { outcome } = await deferredPrompt.userChoice;

		// 清除缓存的提示事件（只能使用一次）
		deferredPrompt = null;

		if (outcome === 'accepted') {
			console.log('[PWA] 用户接受安装');
			return true;
		} else {
			console.log('[PWA] 用户拒绝安装');
			// 记录用户拒绝
			setInstallDismissed();
			return false;
		}
	} catch (error) {
		console.error('[PWA] 安装提示失败:', error);
		deferredPrompt = null;
		return false;
	}
}

/**
 * 检测应用是否已安装（standalone 模式）
 * @returns 是否已安装
 */
export function isInstalled(): boolean {
	if (typeof window === 'undefined') return false;

	// 检查是否在 standalone 模式下运行
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches
		|| (window.navigator as unknown as { standalone?: boolean }).standalone === true;

	return isStandalone;
}

/**
 * 检查安装提示是否已被用户关闭
 * @returns 是否已关闭
 */
export function isInstallDismissed(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === 'true';
	} catch {
		return false;
	}
}

/**
 * 标记安装提示已被用户关闭
 */
export function setInstallDismissed(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
	} catch {
		// 忽略
	}
}

/**
 * 重置安装提示状态（用于调试）
 */
export function resetInstallState(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
	} catch {
		// 忽略
	}
	deferredPrompt = null;
	initialized = false;
}
