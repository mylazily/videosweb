/**
 * JWT Token 存储管理
 * 使用 localStorage 存储 Token
 */

const TOKEN_KEY = 'xvideos_token';
const REFRESH_TOKEN_KEY = 'xvideos_refresh_token';
const USER_KEY = 'xvideos_user';

/**
 * 保存 JWT Token
 */
export function setToken(token: string): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(TOKEN_KEY, token);
	} catch (error) {
		console.error('[Auth] Token 保存失败:', error);
	}
}

/**
 * 获取 JWT Token
 */
export function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

/**
 * 保存刷新 Token
 */
export function setRefreshToken(token: string): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(REFRESH_TOKEN_KEY, token);
	} catch (error) {
		console.error('[Auth] Refresh Token 保存失败:', error);
	}
}

/**
 * 获取刷新 Token
 */
export function getRefreshToken(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	} catch {
		return null;
	}
}

/**
 * 清除所有 Token
 */
export function clearTokens(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	} catch (error) {
		console.error('[Auth] Token 清除失败:', error);
	}
}

/**
 * 判断是否已登录
 */
export function isLoggedIn(): boolean {
	return !!getToken();
}

/**
 * 保存用户信息
 */
export function setUserInfo(user: unknown): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	} catch (error) {
		console.error('[Auth] 用户信息保存失败:', error);
	}
}

/**
 * 获取用户信息
 */
export function getUserInfo<T = unknown>(): T | null {
	if (typeof window === 'undefined') return null;
	try {
		const data = localStorage.getItem(USER_KEY);
		if (!data) return null;
		return JSON.parse(data) as T;
	} catch {
		return null;
	}
}
