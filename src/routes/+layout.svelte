<script lang="ts">
	/**
	 * 全局布局
	 * 顶部 HeaderBar + 底部 NavBar + 内容区域
	 * 集成 Push 推送提示、PWA 安装引导
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import NavBar from '$components/NavBar.svelte';
	import HeaderBar from '$components/HeaderBar.svelte';
	import PushPrompt from '$components/PushPrompt.svelte';
	import { initPWAInstall } from '$lib/pwa/install';
	import { isPushSupported, isSubscribed } from '$lib/push/subscription';
	import { PUSH_PROMPT_DELAY } from '$lib/constants';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Push 提示显示状态
	let showPushPrompt = $state(false);

	// 当前页面标题
	const pageTitle = $derived(() => {
		const path = page.url.pathname;
		if (path === '/') return 'XVideos 影视';
		if (path.startsWith('/search')) return '搜索';
		if (path.startsWith('/category')) return '分类';
		if (path.startsWith('/video')) return '视频详情';
		if (path.startsWith('/short')) return '短视频';
		if (path.startsWith('/tags')) return '标签';
		if (path.startsWith('/rank')) return '排行榜';
		if (path.startsWith('/history')) return '观看历史';
		if (path.startsWith('/profile')) return '个人中心';
		if (path.startsWith('/login')) return '登录';
		if (path.startsWith('/register')) return '注册';
		return 'XVideos 影视';
	});

	// 是否显示底部导航栏
	const showNavBar = $derived(() => {
		const path = page.url.pathname;
		return !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/video') && !path.startsWith('/short/');
	});

	// 是否显示返回按钮
	const showBack = $derived(() => {
		const path = page.url.pathname;
		return path !== '/' && !path.startsWith('/category/') && !path.startsWith('/search');
	});

	onMount(async () => {
		// 初始化 PWA 安装监听
		initPWAInstall();

		// 延迟检测是否需要显示 Push 提示
		if (isPushSupported()) {
			const subscribed = await isSubscribed();
			if (!subscribed) {
				// 延迟显示，避免影响首屏加载
				setTimeout(() => {
					showPushPrompt = true;
				}, PUSH_PROMPT_DELAY);
			}
		}
	});
</script>

<div class="flex flex-col h-screen bg-gray-50 dark:bg-dark-bg overflow-hidden">
	<!-- 顶部标题栏 -->
	<HeaderBar title={pageTitle()} showBack={showBack()} />

	<!-- 内容区域 -->
	<main class="flex-1 overflow-y-auto overflow-x-hidden">
		{@render children()}
	</main>

	<!-- 底部导航栏 -->
	{#if showNavBar()}
		<NavBar />
	{/if}
</div>

<!-- Push 推送订阅引导弹窗 -->
{#if showPushPrompt}
	<PushPrompt />
{/if}
