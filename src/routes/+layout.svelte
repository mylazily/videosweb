<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	onMount(async () => {
		if (!browser) return;

		// 延迟加载非关键模块，不阻塞首屏渲染
		import('$lib/apiConfig').then(({ checkAndActiveApi }) => {
			checkAndActiveApi().catch(() => {});
		});

		// 初始化 Telegram Mini App
		const { isTGMiniApp, initMiniApp, sendSessionToBackend } = await import('$lib/tg/miniapp');
		if (isTGMiniApp()) {
			initMiniApp();
			sendSessionToBackend().catch(() => {});
		}
	});
</script>

{@render children()}
