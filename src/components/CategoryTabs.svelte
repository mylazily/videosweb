<script lang="ts">
	/**
	 * 分类标签栏组件 - 商业级优化版
	 * 支持动态加载、骨架屏、流畅动画
	 */
	import type { Category } from '$lib/types';
	import { getBaseUrl } from '$lib/apiConfig';
	import { API_TIMEOUT } from '$lib/constants';
	import { onMount } from 'svelte';

	interface Props {
		activeSlug?: string;
		onSelect?: (slug: string) => void;
	}

	let { activeSlug = '', onSelect }: Props = $props();

	// 状态
	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let error = $state(false);
	let scrollContainer = $state<HTMLDivElement>();

	// 带超时的 fetch
	async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);
		try {
			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	// 加载分类数据
	async function loadCategories() {
		try {
			const base = getBaseUrl();
			const response = await fetchWithTimeout(`${base}/api/v1/categories`, 3000);
			if (!response.ok) throw new Error('Failed to load');
			const data = await response.json();
			categories = data.data || data.categories || [];
			error = false;
		} catch {
			error = true;
			categories = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCategories();
	});

	// 横向滚动处理
	function handleWheel(e: WheelEvent) {
		if (scrollContainer) {
			e.preventDefault();
			scrollContainer.scrollLeft += e.deltaY;
		}
	}
</script>

<div class="relative">
	<!-- 渐变阴影 - 左侧 -->
	<div class="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-dark-card to-transparent z-10 pointer-events-none"></div>
	
	<!-- 分类列表 -->
	<div
		bind:this={scrollContainer}
		class="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-3 scroll-smooth"
		onwheel={handleWheel}
	>
		{#if loading}
			<!-- 骨架屏 -->
			{#each Array(8) as _, i}
				<div
					class="flex-shrink-0 h-8 rounded-full bg-gray-200 dark:bg-dark-border animate-pulse"
					style="width: {60 + Math.random() * 40}px; animation-delay: {i * 100}ms;"
				></div>
			{/each}
		{:else if error || categories.length === 0}
			<!-- 空状态 - 显示推荐标签 -->
			{#each ['推荐', '热门', '最新', '电影', '电视剧', '动漫'] as tag}
				<button
					onclick={() => onSelect?.(tag === '推荐' ? '' : tag)}
					class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
				>
					{tag}
				</button>
			{/each}
		{:else}
			<!-- 全部分类 -->
			<button
				onclick={() => onSelect?.('')}
				class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 font-medium"
				class:bg-bilibili={activeSlug === ''}
				class:text-white={activeSlug === ''}
				class:bg-gray-100={activeSlug !== ''}
				class:dark:bg-dark-border={activeSlug !== ''}
				class:text-gray-600={activeSlug !== ''}
				class:dark:text-dark-text-secondary={activeSlug !== ''}
			>
				推荐
			</button>
			{#each categories as category}
				<button
					onclick={() => onSelect?.(category.slug)}
					class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 font-medium btn-press"
					class:bg-bilibili={category.slug === activeSlug}
					class:text-white={category.slug === activeSlug}
					class:bg-gray-100={category.slug !== activeSlug}
					class:dark:bg-dark-border={category.slug !== activeSlug}
					class:text-gray-600={category.slug !== activeSlug}
					class:dark:text-dark-text-secondary={category.slug !== activeSlug}
				>
					{#if category.icon}
						<span class="mr-1">{category.icon}</span>
					{/if}
					{category.name}
					{#if category.count}
						<span class="ml-1 text-[10px] opacity-70">{category.count > 999 ? '999+' : category.count}</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
	
	<!-- 渐变阴影 - 右侧 -->
	<div class="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-dark-card to-transparent z-10 pointer-events-none"></div>
</div>

<style>
	/* 隐藏滚动条但保留滚动功能 */
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	
	/* 按钮按压效果 */
	:global(.btn-press) {
		transition: transform 0.1s ease;
	}
	:global(.btn-press:active) {
		transform: scale(0.95);
	}
</style>
