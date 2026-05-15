/**
 * API 域名动态探活切换
 * 使用 Svelte 5 的 $state 创建响应式 baseUrl
 * 支持从 GitHub Gist 拉取域名列表，逐个 ping 找活口
 */

import { DOMAIN_GIST_URL, FALLBACK_DOMAINS, DOMAIN_CHECK_TIMEOUT, API_PATHS } from './constants';
import type { ApiDomain } from './types';

// ========== 响应式状态 ==========

/** 当前激活的 API 基础地址 */
let baseUrl = $state(FALLBACK_DOMAINS[0]);

/** 域名列表 */
let domains = $state<ApiDomain[]>(FALLBACK_DOMAINS.map((url) => ({
	url,
	name: new URL(url).hostname,
	alive: false,
	latency: 0
})));

/** 是否正在检测域名 */
let checking = $state(false);

/** 是否已初始化 */
let initialized = $state(false);

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
 * 逐个 ping 找到第一个可用的域名
 */
export async function checkAndActiveApi(): Promise<string> {
	if (checking) return baseUrl;
	checking = true;

	try {
		// 1. 尝试从 Gist 获取域名列表
		const gistDomains = await fetchDomainsFromGist();
		const allDomains = gistDomains.length > 0 ? gistDomains : FALLBACK_DOMAINS;

		// 2. 更新域名列表状态
		domains = allDomains.map((url) => ({
			url,
			name: new URL(url).hostname,
			alive: false,
			latency: 0
		}));

		// 3. 逐个检测域名（并发检测，取最快的）
		const results = await Promise.allSettled(
			allDomains.map(async (domain) => {
				const latency = await pingDomain(domain);
				return { domain, latency };
			})
		);

		// 4. 找到延迟最低的可用域名
		let bestDomain = '';
		let bestLatency = Infinity;

		for (const result of results) {
			if (result.status === 'fulfilled' && result.value.latency > 0) {
				const { domain, latency } = result.value;
				// 更新域名状态
				const idx = domains.findIndex((d) => d.url === domain);
				if (idx >= 0) {
					domains[idx] = { ...domains[idx], alive: true, latency };
				}
				if (latency < bestLatency) {
					bestLatency = latency;
					bestDomain = domain;
				}
			}
		}

		// 5. 设置激活的域名
		if (bestDomain) {
			baseUrl = bestDomain;
			console.log(`[API] 激活域名: ${bestDomain} (延迟: ${bestLatency}ms)`);
		} else {
			// 全部失败，使用第一个硬编码域名
			baseUrl = FALLBACK_DOMAINS[0];
			console.warn('[API] 所有域名均不可用，使用默认域名');
		}

		initialized = true;
		return baseUrl;
	} catch (error) {
		console.error('[API] 域名检测失败:', error);
		baseUrl = FALLBACK_DOMAINS[0];
		initialized = true;
		return baseUrl;
	} finally {
		checking = false;
	}
}

/**
 * 手动切换到指定域名
 */
export function switchDomain(domainUrl: string): void {
	baseUrl = domainUrl;
	// 更新域名状态
	const idx = domains.findIndex((d) => d.url === domainUrl);
	if (idx >= 0) {
		domains[idx] = { ...domains[idx], alive: true };
	}
	console.log(`[API] 手动切换域名: ${domainUrl}`);
}

/**
 * 获取当前激活的 API 基础地址
 */
export function getBaseUrl(): string {
	return baseUrl;
}

/**
 * 获取域名列表
 */
export function getDomains(): ApiDomain[] {
	return domains;
}

/**
 * 获取检测状态
 */
export function isChecking(): boolean {
	return checking;
}

/**
 * 是否已初始化
 */
export function isInitialized(): boolean {
	return initialized;
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
