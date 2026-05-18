/**
 * API 配置状态管理 Store
 * 
 * 核心策略：动态域名拼接
 * 从浏览器地址栏自动提取主域名，拼接 api 二级域名
 * 例如：用户访问 https://901.555554.xyz → API 地址为 https://api.555554.xyz
 * 
 * 不再依赖 Gist 或硬编码域名列表，完全自动化
 */

import { writable, derived, type Readable } from 'svelte/store';
import { getApiBaseUrl, API_PATHS, DOMAIN_CHECK_TIMEOUT } from '$lib/constants';
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
			mode: 'cors'
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
		const response = await fetchWithTimeout(`${domain}${API_PATHS.HEALTH}`, DOMAIN_CHECK_TIMEOUT);
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
 * 1. 动态计算 api.{domain} 作为主域名
 * 2. 探活检测，成功则激活
 * 3. 失败则使用相对路径（通过 Cloudflare Pages Function 代理）
 */
export async function checkAndActiveApi(): Promise<string> {
	if (isInitialized) return currentBaseUrl;

	checkingStore.set(true);

	try {
		// 1. 动态计算 API 域名
		const dynamicUrl = getApiBaseUrl();

		if (dynamicUrl) {
			// 2. 探活检测
			const latency = await pingDomain(dynamicUrl);
			const domainInfo: ApiDomain = {
				url: dynamicUrl,
				name: new URL(dynamicUrl).hostname,
				alive: latency > 0,
				latency: latency > 0 ? latency : 0
			};

			domainsStore.set([domainInfo]);

			if (latency > 0) {
				baseUrlStore.set(dynamicUrl);
				console.log(`[API] 激活域名: ${dynamicUrl} (延迟: ${latency}ms)`);
			} else {
				baseUrlStore.set('');
				console.warn(`[API] 域名 ${dynamicUrl} 不可用，使用相对路径`);
			}
		} else {
			// 开发环境或 IP 访问，使用相对路径
			baseUrlStore.set('');
			console.log('[API] 使用相对路径（开发模式）');
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
