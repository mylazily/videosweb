/**
 * TG Mini App 适配层
 * 封装 Telegram WebApp SDK，提供类型安全的接口
 * 在非 TG 环境下优雅降级
 */

import type { TGUser, TGSession, TGThemeParams } from '$lib/types';
import { registerTGMiniAppSession } from '$lib/api';

// ========== TG WebApp 类型声明 ==========

/** TG WebApp 接口声明（简化版） */
interface TelegramWebApp {
	ready: () => void;
	expand: () => void;
	close: () => void;
	MainButton: {
		text: string;
		show: () => void;
		hide: () => void;
		onClick: (fn: () => void) => void;
		setParams: (params: { text?: string; color?: string }) => void;
	};
	BackButton: {
		show: () => void;
		hide: () => void;
		onClick: (fn: () => void) => void;
	};
	HapticFeedback: {
		impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
		notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
		selectionChanged: () => void;
	};
	initData: string;
	initDataUnsafe: {
		user?: TGUser;
		start_param?: string;
		auth_date?: number;
		hash?: string;
	};
	themeParams: TGThemeParams;
	colorScheme: 'light' | 'dark';
	version: string;
	platform: string;
	isExpanded: boolean;
}

// ========== 全局声明 ==========

declare global {
	interface Window {
		Telegram?: {
			WebApp: TelegramWebApp;
		};
	}
}

// ========== 核心函数 ==========

/**
 * 检测是否在 TG Mini App 中运行
 */
export function isTGMiniApp(): boolean {
	if (typeof window === 'undefined') return false;
	return !!(window.Telegram?.WebApp?.initData);
}

/**
 * 获取 TG WebApp 实例
 * 非 TG 环境返回 null
 */
function getWebApp(): TelegramWebApp | null {
	if (typeof window === 'undefined') return null;
	return window.Telegram?.WebApp ?? null;
}

/**
 * 获取 TG 用户信息
 * 非 TG 环境返回 null
 */
export function getTGUser(): TGUser | null {
	const webApp = getWebApp();
	if (!webApp?.initDataUnsafe?.user) return null;
	return webApp.initDataUnsafe.user;
}

/**
 * 获取 TG 初始化数据
 * 非 TG 环境返回空字符串
 */
export function getTGInitData(): string {
	const webApp = getWebApp();
	return webApp?.initData ?? '';
}

/**
 * 获取 TG 主题参数
 * 非TG环境返回默认值
 */
export function getTGThemeParams(): TGThemeParams {
	const webApp = getWebApp();
	return webApp?.themeParams ?? {};
}

/**
 * 获取 TG 颜色方案
 */
export function getTGColorScheme(): 'light' | 'dark' {
	const webApp = getWebApp();
	return webApp?.colorScheme ?? 'dark';
}

/**
 * 展开 Mini App
 */
export function expandMiniApp(): void {
	const webApp = getWebApp();
	if (webApp) {
		webApp.expand();
	}
}

/**
 * 关闭 Mini App
 */
export function closeMiniApp(): void {
	const webApp = getWebApp();
	if (webApp) {
		webApp.close();
	}
}

/**
 * 显示 TG 主按钮
 * @param text 按钮文字
 * @param callback 点击回调
 */
export function showMainButton(text: string, callback?: () => void): void {
	const webApp = getWebApp();
	if (!webApp) return;

	webApp.MainButton.setParams({ text });
	webApp.MainButton.show();

	if (callback) {
		webApp.MainButton.onClick(callback);
	}
}

/**
 * 隐藏 TG 主按钮
 */
export function hideMainButton(): void {
	const webApp = getWebApp();
	if (!webApp) return;

	webApp.MainButton.hide();
}

/**
 * 显示 TG 返回按钮
 * @param callback 点击回调
 */
export function showBackButton(callback?: () => void): void {
	const webApp = getWebApp();
	if (!webApp) return;

	webApp.BackButton.show();

	if (callback) {
		webApp.BackButton.onClick(callback);
	}
}

/**
 * 隐藏 TG 返回按钮
 */
export function hideBackButton(): void {
	const webApp = getWebApp();
	if (!webApp) return;

	webApp.BackButton.hide();
}

/**
 * 触觉反馈
 * @param type 反馈类型
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' | 'selection'): void {
	const webApp = getWebApp();
	if (!webApp) return;

	switch (type) {
		case 'light':
		case 'medium':
		case 'heavy':
			webApp.HapticFeedback.impactOccurred(type);
			break;
		case 'error':
		case 'success':
		case 'warning':
			webApp.HapticFeedback.notificationOccurred(type);
			break;
		case 'selection':
			webApp.HapticFeedback.selectionChanged();
			break;
	}
}

/**
 * 初始化 TG Mini App
 * 调用 ready() 通知 TG 客户端 Mini App 已就绪
 */
export function initMiniApp(): void {
	const webApp = getWebApp();
	if (!webApp) return;

	// 通知 TG 客户端 Mini App 已就绪
	webApp.ready();

	// 自动展开
	if (!webApp.isExpanded) {
		webApp.expand();
	}

	// 设置主题色
	applyTGTheme();
}

/**
 * 应用 TG 主题色到页面
 */
export function applyTGTheme(): void {
	const webApp = getWebApp();
	if (!webApp) return;

	const theme = webApp.themeParams;

	// 设置 CSS 变量
	if (theme.bg_color) {
		document.documentElement.style.setProperty('--tg-bg-color', theme.bg_color);
	}
	if (theme.text_color) {
		document.documentElement.style.setProperty('--tg-text-color', theme.text_color);
	}
	if (theme.button_color) {
		document.documentElement.style.setProperty('--tg-button-color', theme.button_color);
	}
	if (theme.secondary_bg_color) {
		document.documentElement.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color);
	}

	// 设置 body 背景色
	if (theme.bg_color) {
		document.body.style.backgroundColor = theme.bg_color;
	}
}

/**
 * 构建 TGSession 对象
 */
export function buildTGSession(): TGSession | null {
	const webApp = getWebApp();
	if (!webApp?.initDataUnsafe?.user) return null;

	return {
		user: webApp.initDataUnsafe.user,
		init_data: webApp.initData,
		start_param: webApp.initDataUnsafe.start_param,
		auth_date: webApp.initDataUnsafe.auth_date ?? Math.floor(Date.now() / 1000),
		hash: webApp.initDataUnsafe.hash ?? '',
		platform: webApp.platform,
		theme_params: webApp.themeParams
	};
}

/**
 * 发送 Mini App 会话数据到后端
 */
export async function sendSessionToBackend(): Promise<void> {
	const session = buildTGSession();
	if (!session) return;

	try {
		await registerTGMiniAppSession(session);
		console.log('[TG] 会话数据已发送到后端');
	} catch (error) {
		console.error('[TG] 发送会话数据失败:', error);
	}
}

/**
 * 获取 TG 启动参数
 */
export function getStartParam(): string | undefined {
	const webApp = getWebApp();
	return webApp?.initDataUnsafe?.start_param;
}

/**
 * 获取 TG 平台信息
 */
export function getTGPlatform(): string {
	const webApp = getWebApp();
	return webApp?.platform ?? 'unknown';
}

/**
 * 获取 TG SDK 版本
 */
export function getTGVersion(): string {
	const webApp = getWebApp();
	return webApp?.version ?? '0.0';
}
