/**
 * API 域名动态探活切换
 * 兼容层，导出 store 和函数供外部使用
 * 注意：此文件保持向后兼容，新代码建议直接从 stores/apiConfigStore 导入
 * 增强：集成域名轮询，API 请求失败时自动切换域名
 */

export {
	// Stores
	baseUrlStore,
	domainsStore,
	checkingStore,
	initializedStore,
	availableDomainsStore,
	// 函数
	checkAndActiveApi,
	switchDomain,
	getBaseUrl,
	getDomains,
	getIsChecking,
	getIsInitialized
} from './stores/apiConfigStore';

// 导出域名轮询模块
export {
	getActiveDomain,
	checkDomainHealth,
	switchDomain as switchDomainWithHealthCheck,
	onDomainSwitch,
	startDomainMonitoring,
	stopDomainMonitoring,
	autoSelectBestDomain,
	getDomainAvailabilityList
} from './domain/rotation';
