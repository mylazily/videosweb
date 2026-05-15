<script lang="ts">
	/**
	 * 全局数据加载
	 * 初始化 API 域名检测
	 */
	import { checkAndActiveApi } from '$lib/apiConfig';
	import { initPWAInstall } from '$lib/pwa/install';

	export async function load() {
		// 初始化 API 域名探活（非阻塞）
		if (typeof window !== 'undefined') {
			checkAndActiveApi().catch(() => {});

			// 初始化 PWA 安装监听
			initPWAInstall();
		}

		return {};
	}
