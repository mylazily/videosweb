/**
 * API 配置状态管理 Store
 * 使用 Svelte 5 的 $state 在 .svelte 文件中创建响应式状态
 * 此文件仅提供基础状态和操作函数
 */

import { writable, derived, type Readable } from 'svelte/store';
import { FALLBACK_DOMAINS, DOMAIN_CHECK_TIMEOUT, API_PATHS, DOMAIN_GIST_URL } from '$lib/constants';
import type { ApiDomain } from '$lib/types';

// ========== Store 状态 ==========

/** 当前激活的 API 基础地址 */
export const baseUrlStore = writable<string>(FALLBACK_DOMAINS[0]);

/** 域名列表 */
export const domainsStore = writable<ApiDomain[]>(
	FALLBACK_DOMAINS.map((url) => ({
		url,
		name: new URL(url).hostname,
		alive: false,
		latency: 0
	}))
);

/** 是否正在检测域名 */
export const checkingStore = writable<boolean>(false);

/** 是否已初始化 */
export const initializedStore = writable<boolean>(false);

/** 获取可用域名列表（按延迟排序） */
export const availableDomainsStore: Readable<ApiDomain[]> = derived(
	domainsStore,
	($domains) => $domains.filter((d) => d.alive).sort((a, b) => a.latency - b.latency)
);

// ========== 内部状态（非响应式） ==========

let currentBaseUrl = FALLBACK_DOMAINS[0];
let currentDomains: ApiDomain[] = FALLBACK_DOMAINS.map((url) => ({
	url,
	name: new URL(url).hostname,
	alive: false,
	latency: 0
}));
let isChecking = false;
let isInitialized = false;

// 订阅 store 保持内部状态同步
baseUrlStore.subscribe((value) => {
	currentBaseUrl = value;
});

domainsStore.subscribe((value) => {
	currentDomains = value;
});

checkingStore.subscribe((value) => {
	isChecking = value;
});

initializedStore.subscribe((value) => {
	isInitialized = value;
});

// ========== 工具函数 ==========

/**
 * 带超时的 fetch 请求
 * @param url 请求地址
 * @param timeout 超时时间（毫秒）
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
	} catch (error) {
		clearTimeout(timer);
		throw error;
	}
}

/**
 * 检测单个域名是否可用
 * @param domain 域名地址
 * @returns 延迟时间（毫秒），失败返回 -1
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

/**
 * 从 GitHub Gist 拉取域名列表
 */
async function fetchDomainsFromGist(): Promise<string[]> {
	try {
		const response = await fetchWithTimeout(DOMAIN_GIST_URL, 3000);
		if (!response.ok) return [];
		const data = await response.json();
		if (Array.isArray(data) && data.length > 0) {
			return data.filter((url: string) => url.startsWith('http'));
		}
		return [];
	} catch {
		return [];
	}
}

// ========== 核心函数 ==========

/**
 * 检测并激活可用的 API 域名
 * 优先从 GitHub Gist 获取域名列表，失败则使用硬编码域名
 * 使用竞速模式快速返回第一个可用的域名
 */
export async function checkAndActiveApi(): Promise<string> {
	if (isChecking) return currentBaseUrl;
	checkingStore.set(true);

	try {
		// 1. 尝试从 Gist 获取域名列表（快速超时）
		const gistPromise = fetchDomainsFromGist();
		const gistTimeout = new Promise<string[]>((resolve) => 
			setTimeout(() => resolve([]), 1500)
		);
		const gistDomains = await Promise.race([gistPromise, gistTimeout]);
		
		const allDomains = gistDomains.length > 0 ? gistDomains : FALLBACK_DOMAINS;

		// 2. 更新域名列表状态
		const newDomains = allDomains.map((url) => ({
			url,
			name: new URL(url).hostname,
			alive: false,
			latency: 0
		}));
		domainsStore.set(newDomains);

		// 3. 竞速模式：返回第一个可用的域名
		const domainPromises = allDomains.map(async (domain) => {
			const latency = await pingDomain(domain);
			return { domain, latency };
		});

		// 添加一个超时 Promise
		const timeoutPromise = new Promise<{ domain: string; latency: number }>((_, reject) => 
			setTimeout(() => reject(new Error('Timeout')), DOMAIN_CHECK_TIMEOUT)
		);

		let bestDomain = '';
		let bestLatency = Infinity;

		try {
			// 等待第一个成功的结果
			const firstResult = await Promise.race([
				...domainPromises.map(p => p.then(r => r.latency > 0 ? r : Promise.reject())),
				timeoutPromise
			]);
			bestDomain = firstResult.domain;
			bestLatency = firstResult.latency;
		} catch {
			// 竞速超时或全部失败，等待所有结果
			const results = await Promise.allSettled(domainPromises);
			const updatedDomains = [...newDomains];

			for (const result of results) {
				if (result.status === 'fulfilled' && result.value.latency > 0) {
					const { domain, latency } = result.value;
					const idx = updatedDomains.findIndex((d) => d.url === domain);
					if (idx >= 0) {
						updatedDomains[idx] = { ...updatedDomains[idx], alive: true, latency };
					}
					if (latency < bestLatency) {
						bestLatency = latency;
						bestDomain = domain;
					}
				}
			}
			domainsStore.set(updatedDomains);
		}

		// 4. 设置激活的域名
		if (bestDomain) {
			baseUrlStore.set(bestDomain);
			console.log(`[API] 激活域名: ${bestDomain} (延迟: ${bestLatency}ms)`);
		} else {
			// 全部失败，使用第一个硬编码域名
			baseUrlStore.set(FALLBACK_DOMAINS[0]);
			console.warn('[API] 所有域名均不可用，使用默认域名');
		}

		initializedStore.set(true);
		return bestDomain || FALLBACK_DOMAINS[0];
	} catch (error) {
		console.error('[API] 域名检测失败:', error);
		baseUrlStore.set(FALLBACK_DOMAINS[0]);
		initializedStore.set(true);
		return FALLBACK_DOMAINS[0];
	} finally {
		checkingStore.set(false);
	}
}

/**
 * 手动切换到指定域名
 */
export function switchDomain(domainUrl: string): void {
	baseUrlStore.set(domainUrl);
	// 更新域名状态
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

/**
 * 获取域名列表
 */
export function getDomains(): ApiDomain[] {
	return currentDomains;
}

/**
 * 获取检测状态
 */
export function getIsChecking(): boolean {
	return isChecking;
}

/**
 * 是否已初始化
 */
export function getIsInitialized(): boolean {
	return isInitialized;
}

// ========== Service Worker 通信 ==========

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data?.type === 'API_DOMAIN_UPDATE') {
			const newDomain = event.data.domain;
			if (newDomain && newDomain.startsWith('http')) {
				switchDomain(newDomain);
			}
		}
	});
}
