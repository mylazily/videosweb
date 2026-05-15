/**
 * 站群配置管理
 * 管理多域名集群配置、爬虫模式检测、重定向策略
 */

import { CLUSTER_DOMAINS, BOT_UA_PATTERNS } from '$lib/constants';
import type { ClusterType, SiteDomain, RedirectRule } from '$lib/types';

// ========== 核心函数 ==========

/**
 * 获取当前域名所属集群
 * @param hostname 当前域名（可选，默认使用 window.location.hostname）
 * @returns 集群类型 (A/B/unknown)
 */
export function getClusterType(hostname?: string): ClusterType {
	const currentHost = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');

	const config = CLUSTER_DOMAINS[currentHost];
	if (config) {
		return config.cluster;
	}

	// 未在配置中找到，返回 unknown
	return 'unknown';
}

/**
 * 获取当前域名配置
 * @param hostname 当前域名（可选）
 * @returns 域名配置或 null
 */
export function getDomainConfig(hostname?: string): SiteDomain | null {
	const currentHost = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
	const config = CLUSTER_DOMAINS[currentHost];

	if (!config) return null;

	return {
		domain: currentHost,
		cluster: config.cluster,
		is_primary: config.is_primary,
		is_active: true,
		ssl: typeof window !== 'undefined' ? window.location.protocol === 'https:' : true
	};
}

/**
 * 检测是否为爬虫模式
 * 通过 UA 字符串判断当前访问者是否为搜索引擎爬虫
 * @param userAgent UA 字符串（可选，默认使用 navigator.userAgent）
 * @returns 是否为爬虫
 */
export function isBotMode(userAgent?: string): boolean {
	const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

	return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

/**
 * 检测是否为爬虫模式（从 API 响应 header 判断）
 * @param headers API 响应头
 * @returns 是否为爬虫模式
 */
export function isBotModeFromHeader(headers: Headers): boolean {
	const botHeader = headers.get('X-Bot-Mode');
	return botHeader === 'true' || botHeader === '1';
}

/**
 * 获取重定向目标
 * 根据当前域名和集群配置，获取应该重定向到的目标域名
 * @param currentHostname 当前域名（可选）
 * @returns 重定向目标域名或 null
 */
export function getRedirectTarget(currentHostname?: string): string | null {
	const host = currentHostname || (typeof window !== 'undefined' ? window.location.hostname : '');
	const config = CLUSTER_DOMAINS[host];

	// 如果当前域名是主域名，不需要重定向
	if (config?.is_primary) return null;

	// 找到同集群的主域名
	const cluster = config?.cluster || getClusterType(host);
	for (const [domain, domainConfig] of Object.entries(CLUSTER_DOMAINS)) {
		if (domainConfig.cluster === cluster && domainConfig.is_primary) {
			return domain;
		}
	}

	return null;
}

/**
 * 获取同集群的所有域名
 * @param cluster 集群类型（可选，默认使用当前集群）
 * @returns 域名列表
 */
export function getClusterDomains(cluster?: ClusterType): SiteDomain[] {
	const currentCluster = cluster || getClusterType();
	const domains: SiteDomain[] = [];

	for (const [domain, config] of Object.entries(CLUSTER_DOMAINS)) {
		if (config.cluster === currentCluster) {
			domains.push({
				domain,
				cluster: config.cluster,
				is_primary: config.is_primary,
				is_active: true,
				ssl: true
			});
		}
	}

	return domains;
}

/**
 * 获取所有域名配置
 * @returns 所有域名配置列表
 */
export function getAllDomains(): SiteDomain[] {
	return Object.entries(CLUSTER_DOMAINS).map(([domain, config]) => ({
		domain,
		cluster: config.cluster,
		is_primary: config.is_primary,
		is_active: true,
		ssl: true
	}));
}

/**
 * 获取重定向规则列表
 * @returns 重定向规则
 */
export function getRedirectRules(): RedirectRule[] {
	const rules: RedirectRule[] = [];
	let priority = 1;

	for (const [domain, config] of Object.entries(CLUSTER_DOMAINS)) {
		if (!config.is_primary) {
			// 非主域名重定向到同集群主域名
			const targetDomain = Object.entries(CLUSTER_DOMAINS).find(
				([d, c]) => c.cluster === config.cluster && c.is_primary
			);

			if (targetDomain) {
				rules.push({
					source_domain: domain,
					target_domain: targetDomain[0],
					priority: priority++,
					conditions: {},
					enabled: true
				});
			}
		}
	}

	return rules.sort((a, b) => a.priority - b.priority);
}

/**
 * 执行域名重定向
 * 如果当前域名需要重定向，则跳转到目标域名
 * @returns 是否执行了重定向
 */
export function performRedirect(): boolean {
	if (typeof window === 'undefined') return false;

	// 爬虫不重定向
	if (isBotMode()) return false;

	const target = getRedirectTarget();
	if (!target) return false;

	const protocol = window.location.protocol;
	const path = window.location.pathname;
	const search = window.location.search;
	const targetUrl = `${protocol}//${target}${path}${search}`;

	console.log(`[站群] 重定向: ${window.location.hostname} -> ${target}`);
	window.location.href = targetUrl;
	return true;
}
