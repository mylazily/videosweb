/**
 * 域名轮询前端模块
 * 提供域名健康检查、自动切换、事件通知
 * 与 apiConfigStore 配合实现无感切换
 */

import type { DomainAvailability, DomainSwitchEvent } from '$lib/types';
import {
	DOMAIN_HEALTH_CHECK_INTERVAL,
	DOMAIN_SWITCH_TIMEOUT,
	DOMAIN_ROTATION_PATH,
	FALLBACK_DOMAINS,
	DOMAIN_GIST_URL
} from '$lib/constants';
import { getBaseUrl, switchDomain as apiSwitchDomain } from '$lib/apiConfig';
import { post } from '$lib/api';

// ========== 事件监听器 ==========

/**
 * 从 GitHub Gist 拉取动态域名列表
 */
async function fetchDomainsFromGist(): Promise<string[]> {
	try {
		const response = await fetch(DOMAIN_GIST_URL, {
			signal: AbortSignal.timeout(3000)
		});
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

type DomainSwitchCallback = (event: DomainSwitchEvent) => void;

const domainSwitchListeners: DomainSwitchCallback[] = [];

/**
 * 监听域名切换事件
 * @param callback 回调函数
 * @returns 取消监听函数
 */
export function onDomainSwitch(callback: DomainSwitchCallback): () => void {
	domainSwitchListeners.push(callback);
	return () => {
		const index = domainSwitchListeners.indexOf(callback);
		if (index >= 0) {
			domainSwitchListeners.splice(index, 1);
		}
	};
}

/**
 * 触发域名切换事件
 */
function emitDomainSwitch(event: DomainSwitchEvent): void {
	domainSwitchListeners.forEach(cb => cb(event));
}

// ========== 域名健康检查 ==========

/**
 * 检查域名健康状态
 * @param domain 域名地址
 * @returns 延迟时间（毫秒），失败返回 -1
 */
export async function checkDomainHealth(domain: string): Promise<number> {
	const startTime = Date.now();

	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 2000);

		const response = await fetch(`${domain}/api/health`, {
			method: 'GET',
			signal: controller.signal,
			mode: 'cors',
			cache: 'no-cache'
		});

		clearTimeout(timer);

		if (response.ok) {
			return Date.now() - startTime;
		}
		return -1;
	} catch {
		return -1;
	}
}

/**
 * 获取当前活跃域名
 */
export function getActiveDomain(): string {
	return getBaseUrl();
}

/**
 * 手动切换域名
 * @param domain 目标域名
 * @param reason 切换原因
 */
export async function switchDomain(
	domain: string,
	reason: 'manual' | 'health_check' | 'auto_failover' = 'manual'
): Promise<boolean> {
	const fromDomain = getActiveDomain();

	if (domain === fromDomain) {
		return true;
	}

	// 检查目标域名是否可用
	const latency = await checkDomainHealth(domain);
	if (latency < 0) {
		console.warn(`[域名轮询] 目标域名不可用: ${domain}`);
		return false;
	}

	// 切换域名
	apiSwitchDomain(domain);

	// 构建切换事件
	const event: DomainSwitchEvent = {
		from_domain: fromDomain,
		to_domain: domain,
		reason,
		timestamp: new Date().toISOString()
	};

	// 通知监听器
	emitDomainSwitch(event);

	// 上报到后端（非阻塞，使用管理员路由）
	post('/api/v1/admin/domain/switch', event).catch(() => {
		// 上报失败不影响切换
	});

	console.log(`[域名轮询] 域名已切换: ${fromDomain} -> ${domain} (延迟: ${latency}ms)`);
	return true;
}

/**
 * 自动选择最优域名
 * 优先从 Gist 获取动态域名，然后从备用域名中选择延迟最低的可用域名
 */
export async function autoSelectBestDomain(): Promise<string | null> {
	// 1. 尝试从 Gist 获取动态域名
	let allDomains = [...FALLBACK_DOMAINS];
	try {
		const gistDomains = await fetchDomainsFromGist();
		if (gistDomains.length > 0) {
			allDomains = [...gistDomains, ...FALLBACK_DOMAINS];
		}
	} catch {
		// Gist 不可用，使用硬编码域名
	}

	// 2. 并行检查所有域名
	const results = await Promise.allSettled(
		allDomains.map(async (domain) => {
			const latency = await checkDomainHealth(domain);
			return { domain, latency };
		})
	);

	// 3. 找到延迟最低的可用域名
	let bestDomain: string | null = null;
	let bestLatency = Infinity;

	for (const result of results) {
		if (result.status === 'fulfilled' && result.value.latency > 0) {
			if (result.value.latency < bestLatency) {
				bestLatency = result.value.latency;
				bestDomain = result.value.domain;
			}
		}
	}

	return bestDomain;
}

// ========== 自动轮询 ==========

let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let isMonitoring = false;

/**
 * 启动域名健康监控
 * 定期检查当前域名健康状态，异常时自动切换
 */
export function startDomainMonitoring(): void {
	if (isMonitoring) return;
	isMonitoring = true;

	healthCheckTimer = setInterval(async () => {
		const currentDomain = getActiveDomain();
		const latency = await checkDomainHealth(currentDomain);

		if (latency < 0) {
			console.warn(`[域名轮询] 当前域名不可用: ${currentDomain}，尝试自动切换`);

			const bestDomain = await autoSelectBestDomain();
			if (bestDomain) {
				await switchDomain(bestDomain, 'auto_failover');
			} else {
				console.error('[域名轮询] 没有可用的备用域名');
			}
		}
	}, DOMAIN_HEALTH_CHECK_INTERVAL);

	console.log('[域名轮询] 域名健康监控已启动');
}

/**
 * 停止域名健康监控
 */
export function stopDomainMonitoring(): void {
	if (healthCheckTimer) {
		clearInterval(healthCheckTimer);
		healthCheckTimer = null;
	}
	isMonitoring = false;
	console.log('[域名轮询] 域名健康监控已停止');
}

/**
 * 获取域名可用性列表
 */
export async function getDomainAvailabilityList(): Promise<DomainAvailability[]> {
	const results = await Promise.allSettled(
		FALLBACK_DOMAINS.map(async (domain) => {
			const latency = await checkDomainHealth(domain);
			return {
				domain,
				is_alive: latency > 0,
				latency: Math.max(0, latency),
				checked_at: new Date().toISOString()
			};
		})
	);

	return results
		.filter((r): r is PromiseFulfilledResult<DomainAvailability> => r.status === 'fulfilled')
		.map(r => r.value);
}
