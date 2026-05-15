<script lang="ts">
	/**
	 * 底部导航栏组件
	 * 5个 tab：首页/分类/排行/历史/我的
	 */
	import { page } from '$app/state';
	import { NAV_ITEMS } from '$lib/constants';

	// 当前激活的 tab
	const currentPath = $derived(page.url.pathname);

	// 判断是否激活
	function isActive(path: string): boolean {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}

	// tab 图标 SVG
	const icons: Record<string, string> = {
		home: 'M12 3l-10 9h3v7h6v-5h2v5h6v-7h3L12 3zm0 2.84L18 12v6h-2v-5H6v5H4v-6l8-7.16z',
		grid: 'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z',
		trophy: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12.5v5l4.28 2.54.72-1.21-3.5-2.08V7.5H11z',
		clock: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
		user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
	};
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border"
     style="padding-bottom: env(safe-area-inset-bottom, 0px);">
	<div class="flex items-center justify-around h-[50px]">
		{#each NAV_ITEMS as item}
			<a
				href={item.path}
				class="flex flex-col items-center justify-center w-full h-full transition-colors duration-200 btn-press"
				class:text-bilibili={isActive(item.path)}
				class:text-gray-400={!isActive(item.path)}
			>
				<svg class="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
					<path d={icons[item.icon]} />
				</svg>
				<span class="text-[10px]">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
