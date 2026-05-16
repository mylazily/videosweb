<script lang="ts">
	/**
	 * 全局布局
	 * 初始化 API 域名检测和 PWA
	 */
	import { checkAndActiveApi } from '$lib/apiConfig';
	import { initPWAInstall } from '$lib/pwa/install';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// 初始化 API 域名探活（非阻塞）
		checkAndActiveApi().catch(() => {});
		// 初始化 PWA 安装监听
		initPWAInstall();
	});
</script>

{@render children()}
