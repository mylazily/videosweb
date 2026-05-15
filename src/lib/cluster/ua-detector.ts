/**
 * 前端 UA 检测工具
 * 解析 User-Agent 字符串，提取浏览器、操作系统、设备等信息
 */

import { SOCIAL_REFERRER_DOMAINS } from '$lib/constants';
import type { UADetectionResult } from '$lib/types';

// ========== 核心检测函数 ==========

/**
 * 检测是否为移动端设备
 * @param ua UA 字符串（可选，默认使用 navigator.userAgent）
 * @returns 是否为移动端
 */
export function isMobile(ua?: string): boolean {
	const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * 检测是否来自社交媒体
 * 通过 document.referrer 判断用户是否从社交媒体跳转而来
 * @param referrer 来源页面（可选，默认使用 document.referrer）
 * @returns 是否来自社交媒体
 */
export function isFromSocial(referrer?: string): boolean {
	const ref = referrer || (typeof document !== 'undefined' ? document.referrer : '');

	if (!ref) return false;

	try {
		const refUrl = new URL(ref);
		const refHost = refUrl.hostname.toLowerCase();

		return SOCIAL_REFERRER_DOMAINS.some((domain) =>
			refHost === domain || refHost.endsWith(`.${domain}`)
		);
	} catch {
		return false;
	}
}

/**
 * 获取完整的 UA 检测结果
 * @param ua UA 字符串（可选）
 * @param referrer 来源页面（可选）
 * @returns UA 检测结果
 */
export function getUADetection(ua?: string, referrer?: string): UADetectionResult {
	const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
	const ref = referrer || (typeof document !== 'undefined' ? document.referrer : '');

	const browser = getBrowserInfo(userAgent);
	const os = getOSInfo(userAgent);
	const mobile = isMobile(userAgent);
	const tablet = isTablet(userAgent);
	const desktop = !mobile && !tablet;
	const social = isFromSocial(ref);
	const socialPlatform = social ? detectSocialPlatform(ref) : undefined;

	return {
		is_mobile: mobile,
		is_tablet: tablet,
		is_desktop: desktop,
		is_from_social: social,
		social_platform: socialPlatform,
		browser,
		os,
		device: getDeviceInfo(),
		raw_ua: userAgent
	};
}

/**
 * 获取浏览器信息
 * @param ua UA 字符串（可选）
 * @returns 浏览器名称、版本、引擎
 */
export function getBrowserInfo(ua?: string): UADetectionResult['browser'] {
	const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

	let name = '未知浏览器';
	let version = '';
	let engine = '未知';

	// 检测浏览器
	if (userAgent.includes('Firefox')) {
		name = 'Firefox';
		const match = userAgent.match(/Firefox\/([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'Gecko';
	} else if (userAgent.includes('Edg/')) {
		name = 'Edge';
		const match = userAgent.match(/Edg\/([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'Blink';
	} else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) {
		name = 'Opera';
		const match = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'Blink';
	} else if (userAgent.includes('Chrome')) {
		name = 'Chrome';
		const match = userAgent.match(/Chrome\/([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'Blink';
	} else if (userAgent.includes('Safari')) {
		name = 'Safari';
		const match = userAgent.match(/Version\/([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'WebKit';
	} else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
		name = 'Internet Explorer';
		const match = userAgent.match(/(?:MSIE |rv:)([\d.]+)/);
		version = match ? match[1] : '';
		engine = 'Trident';
	}

	// 检测引擎
	if (userAgent.includes('AppleWebKit')) {
		engine = 'WebKit';
	}
	if (userAgent.includes('Gecko/') && !userAgent.includes('like Gecko')) {
		engine = 'Gecko';
	}

	return { name, version, engine };
}

/**
 * 获取操作系统信息
 * @param ua UA 字符串（可选）
 * @returns 操作系统名称和版本
 */
export function getOSInfo(ua?: string): UADetectionResult['os'] {
	const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

	let name = '未知系统';
	let version = '';

	if (userAgent.includes('Windows')) {
		name = 'Windows';
		if (userAgent.includes('Windows NT 10.0')) version = '10/11';
		else if (userAgent.includes('Windows NT 6.3')) version = '8.1';
		else if (userAgent.includes('Windows NT 6.2')) version = '8';
		else if (userAgent.includes('Windows NT 6.1')) version = '7';
		else {
			const match = userAgent.match(/Windows NT ([\d.]+)/);
			version = match ? match[1] : '';
		}
	} else if (userAgent.includes('Mac OS X')) {
		name = 'macOS';
		const match = userAgent.match(/Mac OS X ([\d_.]+)/);
		version = match ? match[1].replace(/_/g, '.') : '';
	} else if (userAgent.includes('Android')) {
		name = 'Android';
		const match = userAgent.match(/Android ([\d.]+)/);
		version = match ? match[1] : '';
	} else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
		name = 'iOS';
		const match = userAgent.match(/OS ([\d_]+)/);
		version = match ? match[1].replace(/_/g, '.') : '';
	} else if (userAgent.includes('Linux')) {
		name = 'Linux';
	} else if (userAgent.includes('CrOS')) {
		name = 'ChromeOS';
	}

	return { name, version };
}

// ========== 内部工具函数 ==========

/**
 * 检测是否为平板设备
 */
function isTablet(ua: string): boolean {
	return /iPad|Android(?!.*Mobile)|Tablet|Kindle|Silk/i.test(ua);
}

/**
 * 获取设备信息
 */
function getDeviceInfo(): UADetectionResult['device'] {
	const screenWidth = typeof window !== 'undefined' ? window.screen.width : 0;
	const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
	const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

	return {
		screen_width: screenWidth,
		screen_height: screenHeight,
		pixel_ratio
	};
}

/**
 * 检测社交媒体平台
 */
function detectSocialPlatform(referrer: string): UADetectionResult['social_platform'] {
	try {
		const refUrl = new URL(referrer);
		const host = refUrl.hostname.toLowerCase();

		if (host.includes('twitter.com') || host.includes('x.com') || host.includes('t.co')) {
			return 'twitter';
		}
		if (host.includes('t.me') || host.includes('telegram.org')) {
			return 'telegram';
		}
		if (host.includes('facebook.com') || host.includes('fb.com')) {
			return 'facebook';
		}
		if (host.includes('weibo.com')) {
			return 'weibo';
		}
		if (host.includes('wx.qq.com') || host.includes('weixin')) {
			return 'wechat';
		}
	} catch {
		// 忽略解析错误
	}

	return 'unknown';
}
