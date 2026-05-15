/**
 * API 域名动态探活切换
 * 兼容层，导出 store 和函数供外部使用
 * 注意：此文件保持向后兼容，新代码建议直接从 stores/apiConfigStore 导入
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
	isChecking,
	isInitialized
} from './stores/apiConfigStore';
