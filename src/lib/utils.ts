/**
 * 工具函数
 * 时间格式化、数字格式化等通用工具
 */

/**
 * 格式化播放次数
 * @param count 播放次数
 * @returns 格式化后的字符串（如 1.2万、3.5亿）
 */
export function formatPlayCount(count: number): string {
	if (count >= 100000000) {
		return (count / 100000000).toFixed(1) + '亿';
	}
	if (count >= 10000) {
		return (count / 10000).toFixed(1) + '万';
	}
	return String(count);
}

/**
 * 格式化时间（秒 -> mm:ss 或 hh:mm:ss）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export function formatDuration(seconds: number): string {
	if (seconds < 0) return '00:00';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	const pad = (n: number) => String(n).padStart(2, '0');

	if (h > 0) {
		return `${pad(h)}:${pad(m)}:${pad(s)}`;
	}
	return `${pad(m)}:${pad(s)}`;
}

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化后的日期（如 "3天前"、"2024-01-01"）
 */
export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	const month = 30 * day;

	if (diff < minute) return '刚刚';
	if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
	if (diff < day) return `${Math.floor(diff / hour)}小时前`;
	if (diff < month) return `${Math.floor(diff / day)}天前`;
	if (diff < 12 * month) return `${Math.floor(diff / month)}个月前`;

	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/**
 * 格式化评分
 * @param rating 评分（0-10）
 * @returns 格式化后的评分字符串
 */
export function formatRating(rating: number): string {
	return rating.toFixed(1);
}

/**
 * 生成评分星星 HTML
 * @param rating 评分（0-10）
 * @returns 星星数量描述
 */
export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
	const normalizedRating = rating / 2; // 转换为 5 星制
	const full = Math.floor(normalizedRating);
	const half = normalizedRating - full >= 0.5;
	const empty = 5 - full - (half ? 1 : 0);
	return { full, half, empty };
}

/**
 * 截断文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength) + '...';
}

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
	let timer: ReturnType<typeof setTimeout>;
	return ((...args: unknown[]) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	}) as T;
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param delay 间隔时间（毫秒）
 */
export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
	let lastTime = 0;
	return ((...args: unknown[]) => {
		const now = Date.now();
		if (now - lastTime >= delay) {
			lastTime = now;
			fn(...args);
		}
	}) as T;
}

/**
 * 生成随机 ID
 * @param prefix 前缀
 * @returns 随机 ID 字符串
 */
export function generateId(prefix: string = ''): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).slice(2, 8);
	return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 深拷贝
 * @param obj 要拷贝的对象
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * 判断是否为空值
 * @param value 要检查的值
 */
export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === 'string') return value.trim().length === 0;
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === 'object') return Object.keys(value).length === 0;
	return false;
}

/**
 * URL 查询参数构建
 * @param params 参数对象
 * @returns 查询字符串（含 ?）
 */
export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.append(key, String(value));
		}
	});
	const query = searchParams.toString();
	return query ? `?${query}` : '';
}

/**
 * 安全解析 JSON
 * @param json JSON 字符串
 * @param defaultValue 解析失败时的默认值
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
	try {
		return JSON.parse(json) as T;
	} catch {
		return defaultValue;
	}
}

/**
 * 设置页面标题
 * @param title 标题
 */
export function setPageTitle(title: string): void {
	if (typeof document !== 'undefined') {
		document.title = `${title} - XVideos 影视`;
	}
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		// 兼容旧浏览器
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
		return true;
	} catch {
		return false;
	}
}
