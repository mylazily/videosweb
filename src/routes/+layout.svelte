<script lang="ts">
	/**
	 * 全局布局
	 * 顶部 HeaderBar + 底部 NavBar + 内容区域
	 * 集成 Push 推送提示、PWA 安装引导
	 * TG Mini App 环境适配
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import NavBar from '$components/NavBar.svelte';
	import HeaderBar from '$components/HeaderBar.svelte';
	import TGHeader from '$components/TGHeader.svelte';
	import PushPrompt from '$components/PushPrompt.svelte';
	import { initPWAInstall } from '$lib/pwa/install';
	import { isPushSupported, isSubscribed } from '$lib/push/subscription';
	import { PUSH_PROMPT_DELAY } from '$lib/constants';
	import {
		isTGMiniApp,
		initMiniApp,
		sendSessionToBackend,
		applyTGTheme,
		getTGColorScheme
	} from '$lib/tg/miniapp';
	import { startDomainMonitoring } from '$lib/domain/rotation';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Push 提示显示状态
	let showPushPrompt = $state(false);

	// TG Mini App 环境检测
	let inTG = $state(false);

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

	// 是否显示底部导航栏（TG 环境下隐藏）
	const showNavBar = $derived(() => {
		if (inTG) return false;
		const path = page.url.pathname;
		return !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/video') && !path.startsWith('/short/');
	});

	// 是否显示返回按钮
	const showBack = $derived(() => {
		const path = page.url.pathname;
		return path !== '/' && !path.startsWith('/category/') && !path.startsWith('/search');
	});

	onMount(async () => {
		// 检测 TG Mini App 环境
		inTG = isTGMiniApp();

		if (inTG) {
			// 初始化 TG Mini App
			initMiniApp();
			// 发送会话数据到后端
			sendSessionToBackend();
			// 应用 TG 主题色
			applyTGTheme();
			console.log('[布局] TG Mini App 环境已检测');
		} else {
			// 非TG环境：初始化 PWA 和 Push
			initPWAInstall();

			// 启动域名健康监控
			startDomainMonitoring();

			if (isPushSupported()) {
				const subscribed = await isSubscribed();
				if (!subscribed) {
					setTimeout(() => {
						showPushPrompt = true;
					}, PUSH_PROMPT_DELAY);
				}
			}
		}
	});
</script>

<div
	class="flex flex-col h-screen overflow-hidden"
	class:bg-gray-50={!inTG}
	class:dark:bg-dark-bg={!inTG}
	style={inTG ? `background-color: var(--tg-bg-color, #1a1a2e); color: var(--tg-text-color, #ffffff);` : ''}
>
	<!-- TG 环境使用 TGHeader，否则使用 HeaderBar -->
	{#if inTG}
		<TGHeader title={pageTitle()} />
	{:else}
		<HeaderBar title={pageTitle()} showBack={showBack()} />
	{/if}

	<!-- 内容区域 -->
	<main class="flex-1 overflow-y-auto overflow-x-hidden">
		{@render children()}
	</main>

	<!-- 底部导航栏（TG 环境下不显示） -->
	{#if showNavBar()}
		<NavBar />
	{/if}
</div>

<!-- Push 推送订阅引导弹窗（TG 环境下不显示） -->
{#if showPushPrompt && !inTG}
	<PushPrompt />
{/if}
