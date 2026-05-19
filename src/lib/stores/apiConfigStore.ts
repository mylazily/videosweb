/**
 * API 配置状态管理 Store
 *
 * 核心策略：智能域名选择
 * 1. 开发环境：使用相对路径，通过 Vite 代理
 * 2. 生产环境：动态计算 api.{domain} 作为主域名
 * 3. 备用方案：探活失败时使用 FALLBACK_DOMAINS
 *
 * 不再依赖 Gist 或硬编码域名列表，完全自动化
 */

import { writable, derived, type Readable } from 'svelte/store';
import {
	getApiBaseUrl,
	API_PATHS,
	DOMAIN_CHECK_TIMEOUT,
	FALLBACK_DOMAINS,
	DEFAULT_API_DOMAIN,
	isDevelopment,
} from '$lib/constants';
import type { ApiDomain } from '$lib/types';

// ========== Store 状态 ==========

/** 当前激活的 API 基础地址 */
export const baseUrlStore = writable<string>('');

/** 域名列表 */
export const domainsStore = writable<ApiDomain[]>([]);

/** 是否正在检测域名 */
export const checkingStore = writable<boolean>(false);

/** 是否已初始化 */
export const initializedStore = writable<boolean>(false);

/** 获取可用域名列表 */
export const availableDomainsStore: Readable<ApiDomain[]> = derived(
	domainsStore,
	($domains) => $domains.filter((d) => d.alive).sort((a, b) => a.latency - b.latency)
);

// ========== 内部状态 ==========

let currentBaseUrl = '';
let isInitialized = false;

baseUrlStore.subscribe((value) => {
	currentBaseUrl = value;
});

initializedStore.subscribe((value) => {
	isInitialized = value;
});

// ========== 工具函数 ==========

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		const response = await fetch(url, {
			method: 'GET',
			signal: controller.signal,
			mode: 'cors',
		});
		clearTimeout(timer);
		return response;
	} catch {
		clearTimeout(timer);
		throw new Error('fetch timeout');
	}
}

/**
 * 检测单个域名是否可用
 */
async function pingDomain(domain: string): Promise<number> {
	const startTime = Date.now();
	try {
		const url = domain ? `${domain}${API_PATHS.HEALTH}` : API_PATHS.HEALTH;
		const response = await fetchWithTimeout(url, DOMAIN_CHECK_TIMEOUT);
		if (response.ok) {
			return Date.now() - startTime;
		}
		return -1;
	} catch {
		return -1;
	}
}

// ========== 核心函数 ==========

/**
 * 检测并激活可用的 API 域名
 *
 * 策略：
 * 1. 开发环境：使用相对路径（baseUrl 为空）
 * 2. 动态计算 API 域名，探活检测
 * 3. 失败则尝试备用域名
 * 4. 都失败则使用相对路径（通过 Cloudflare Pages Function 代理）
 */
export async function checkAndActiveApi(): Promise<string> {
	if (isInitialized) return currentBaseUrl;

	checkingStore.set(true);

	try {
		// 1. 开发环境直接使用相对路径
		if (isDevelopment()) {
			baseUrlStore.set('');
			console.log('[API] 开发环境，使用相对路径');
			initializedStore.set(true);
			return '';
		}

		// 2. 动态计算 API 域名
		const dynamicUrl = getApiBaseUrl();

		if (dynamicUrl) {
			// 3. 探活检测
			console.log(`[API] 检测域名: ${dynamicUrl}`);
			const latency = await pingDomain(dynamicUrl);

			const domainInfo: ApiDomain = {
				url: dynamicUrl,
				name: new URL(dynamicUrl).hostname,
				alive: latency > 0,
				latency: latency > 0 ? latency : 0,
			};

			domainsStore.set([domainInfo, ...FALLBACK_DOMAINS.map((url) => ({
				url,
				name: new URL(url).hostname,
				alive: false,
				latency: 0,
			}))]);

			if (latency > 0) {
				baseUrlStore.set(dynamicUrl);
				console.log(`[API] 激活域名: ${dynamicUrl} (延迟: ${latency}ms)`);
				initializedStore.set(true);
				return dynamicUrl;
			}

			// 4. 尝试备用域名
			console.log(`[API] 主域名不可用，尝试备用域名...`);
			for (const fallbackUrl of FALLBACK_DOMAINS) {
				const fallbackLatency = await pingDomain(fallbackUrl);
				if (fallbackLatency > 0) {
					baseUrlStore.set(fallbackUrl);
					console.log(`[API] 激活备用域名: ${fallbackUrl} (延迟: ${fallbackLatency}ms)`);
					initializedStore.set(true);
					return fallbackUrl;
				}
			}

			// 5. 所有域名都不可用，使用相对路径（让 Cloudflare 代理）
			console.warn('[API] 所有域名都不可用，使用相对路径');
			baseUrlStore.set('');
		} else {
			// 开发环境或无法确定域名
			baseUrlStore.set('');
			console.log('[API] 使用相对路径（无法确定域名）');
		}

		initializedStore.set(true);
		return currentBaseUrl;
	} catch (error) {
		console.error('[API] 域名检测失败:', error);
		baseUrlStore.set('');
		initializedStore.set(true);
		return '';
	} finally {
		checkingStore.set(false);
	}
}

/**
 * 手动切换到指定域名
 */
export function switchDomain(domainUrl: string): void {
	baseUrlStore.set(domainUrl);
	domainsStore.update((domains) => {
		const idx = domains.findIndex((d) => d.url === domainUrl);
		if (idx >= 0) {
			const updated = [...domains];
			updated[idx] = { ...updated[idx], alive: true };
			return updated;
		}
		return domains;
	});
	console.log(`[API] 手动切换域名: ${domainUrl}`);
}

/**
 * 获取当前激活的 API 基础地址
 */
export function getBaseUrl(): string {
	return currentBaseUrl;
}
