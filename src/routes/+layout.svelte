<script lang="ts">
	/**
	 * 全局布局
	 * 顶部 HeaderBar + 底部 NavBar + 内容区域
	 */
	import { page } from '$app/state';
	import NavBar from '$components/NavBar.svelte';
	import HeaderBar from '$components/HeaderBar.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// 当前页面标题
	const pageTitle = $derived(() => {
		const path = page.url.pathname;
		if (path === '/') return 'XVideos 影视';
		if (path.startsWith('/search')) return '搜索';
		if (path.startsWith('/category')) return '分类';
		if (path.startsWith('/video')) return '视频详情';
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
		return !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/video');
	});

	// 是否显示返回按钮
	const showBack = $derived(() => {
		const path = page.url.pathname;
		return path !== '/' && !path.startsWith('/category/') && !path.startsWith('/search');
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
