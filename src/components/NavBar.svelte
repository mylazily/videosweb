<script lang="ts">
	/**
	 * 底部导航栏组件 - 商业级优化版
	 * 5个 tab：首页/短视频/分类/排行/我的
	 * 增强：添加金币余额显示、动画效果
	 */
	import { page } from '$app/state';
	import CoinBalance from '$components/CoinBalance.svelte';

	// 当前激活的 tab
	const currentPath = $derived(page.url.pathname);

	// 是否显示金币余额（仅在"我的"页面）
	const showCoinBalance = $derived(currentPath.startsWith('/profile'));

	// 导航项配置
	const navItems = [
		{ path: '/', label: '首页', icon: 'home' },
		{ path: '/short', label: '短视频', icon: 'video' },
		{ path: '/category', label: '分类', icon: 'grid' },
		{ path: '/rank', label: '排行', icon: 'trophy' },
		{ path: '/profile', label: '我的', icon: 'user' }
	] as const;

	// tab 图标 SVG
	const icons: Record<string, string> = {
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
		trophy: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
		user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
	};

	// 判断是否激活
	function isActive(path: string): boolean {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-card/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-dark-border/80"
     style="padding-bottom: env(safe-area-inset-bottom, 0px);">
	<div class="flex items-center justify-around h-[56px] relative">
		{#each navItems as item, index}
			{@const active = isActive(item.path)}
			<a
				href={item.path}
				class="flex flex-col items-center justify-center w-full h-full relative transition-all duration-200 group"
				class:text-bilibili={active}
				class:text-gray-400={!active}
				class:dark:text-gray-500={!active}
			>
				<!-- 激活指示器 -->
				{#if active}
					<div class="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-bilibili rounded-b-full"></div>
				{/if}
				
				<!-- 图标容器 -->
				<div class="relative">
					<svg 
						class="w-6 h-6 transition-transform duration-200 group-active:scale-90" 
						viewBox="0 0 24 24" 
						fill="none"
						stroke="currentColor"
						stroke-width={active ? "2" : "1.5"}
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d={icons[item.icon]} />
					</svg>
					
					<!-- 未读红点（示例） -->
					{#if item.path === '/profile'}
						<span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
					{/if}
				</div>
				
				<!-- 标签 -->
				<span 
					class="text-[11px] mt-0.5 font-medium transition-all duration-200"
					class:font-semibold={active}
				>
					{item.label}
				</span>
			</a>
		{/each}
		
		<!-- 金币余额（仅在个人页面显示） -->
		{#if showCoinBalance}
			<div class="absolute -top-12 right-4">
				<CoinBalance />
			</div>
		{/if}
	</div>
</nav>

<!-- 占位高度 -->
<div class="h-[56px]" style="margin-bottom: env(safe-area-inset-bottom, 0px);"></div>
