<script lang="ts">
	/**
	 * 搜索页 - 商业级优化版
	 * 搜索框 + 热搜词 + 搜索结果列表
	 */
	import type { HotWord, Video } from '$lib/types';
	import { getBaseUrl } from '$lib/apiConfig';
	import { API_TIMEOUT } from '$lib/constants';
	import SearchBar from '$components/SearchBar.svelte';
	import VideoCard from '$components/VideoCard.svelte';
	import LoadingSpinner from '$components/LoadingSpinner.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';
	import HeaderBar from '$components/HeaderBar.svelte';
	import NavBar from '$components/NavBar.svelte';
	import { onMount } from 'svelte';

	// 状态
	let hotWords = $state<HotWord[]>([]);
	let searchResults = $state<Video[]>([]);
	let keyword = $state('');
	let isSearching = $state(false);
	let hasSearched = $state(false);
	let loading = $state(false);
	let error = $state('');
	let hotWordsLoading = $state(true);

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

	// 加载热搜词
	async function loadHotWords() {
		try {
			const base = getBaseUrl();
			const response = await fetchWithTimeout(`${base}/api/v1/search/hot`, 3000);
			if (!response.ok) throw new Error('Failed');
			const data = await response.json();
			hotWords = data.data || data.hot_words || [];
		} catch {
			hotWords = [];
		} finally {
			hotWordsLoading = false;
		}
	}

	onMount(() => {
		loadHotWords();
	});

	// 执行搜索
	async function handleSearch(kw: string) {
		if (!kw.trim()) return;
		keyword = kw.trim();
		isSearching = true;
		hasSearched = true;
		loading = true;
		error = '';

		try {
			const base = getBaseUrl();
			const response = await fetchWithTimeout(`${base}/api/v1/search?q=${encodeURIComponent(keyword)}&page=1&page_size=20`, 5000);
			if (!response.ok) throw new Error('搜索失败');
			const data = await response.json();
			searchResults = data.data?.list || data.data || [];
		} catch {
			error = '搜索失败，请稍后重试';
			searchResults = [];
		} finally {
			loading = false;
		}
	}

	// 点击热搜词
	function handleHotWordClick(word: string) {
		keyword = word;
		handleSearch(word);
	}

	// 清除搜索
	function handleClear() {
		keyword = '';
		searchResults = [];
		hasSearched = false;
		error = '';
	}
</script>

<svelte:head>
	<title>搜索 - XVideos 影视</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-dark-bg">
	<HeaderBar showSearch={false} showBack={true} title="搜索" />
	
	<!-- 搜索栏 -->
	<div class="sticky top-[50px] z-40 bg-white dark:bg-dark-card shadow-sm">
		<div class="px-4 py-3">
			<div class="flex items-center gap-2">
				<div class="flex-1 relative">
					<input
						type="text"
						bind:value={keyword}
						placeholder="搜索电影、电视剧、动漫..."
						class="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bilibili/50 transition-all"
						onkeydown={(e) => e.key === 'Enter' && handleSearch(keyword)}
					/>
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"/>
						<path d="M21 21l-4.35-4.35"/>
					</svg>
					{#if keyword}
						<button
							onclick={handleClear}
							class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
						>
							<svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
								<path d="M6 18L18 6M6 6l12 12"/>
							</svg>
						</button>
					{/if}
				</div>
				<button
					onclick={() => handleSearch(keyword)}
					class="h-10 px-4 rounded-xl bg-bilibili text-white text-sm font-medium hover:bg-bilibili/90 active:scale-95 transition-all"
				>
					搜索
				</button>
			</div>
		</div>
	</div>

	<!-- 搜索内容 -->
	<div class="flex-1 overflow-y-auto pb-20">
		{#if !hasSearched}
			<!-- 热搜榜 -->
			<div class="px-4 py-4">
				<div class="flex items-center gap-2 mb-4">
					<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
						<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
						</svg>
					</div>
					<h3 class="text-base font-bold text-gray-900 dark:text-dark-text">热搜榜</h3>
				</div>
				
				{#if hotWordsLoading}
					<!-- 骨架屏 -->
					<div class="space-y-2">
						{#each Array(10) as _}
							<div class="flex items-center gap-3 py-2">
								<div class="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
								<div class="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
							</div>
						{/each}
					</div>
				{:else if hotWords.length === 0}
					<!-- 空状态 -->
					<div class="flex flex-col items-center justify-center py-12 text-gray-400">
						<svg class="w-12 h-12 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<p class="text-sm">暂无热搜数据</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-2">
						{#each hotWords as word, i}
							<button
								onclick={() => handleHotWordClick(word.word)}
								class="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-98 transition-all text-left shadow-sm"
							>
								<span 
									class="w-5 h-5 flex items-center justify-center rounded text-xs font-bold"
									class:bg-red-500={i < 3}
									class:text-white={i < 3}
									class:bg-gray-200={i >= 3}
									class:dark:bg-gray-700={i >= 3}
									class:text-gray-500={i >= 3}
								>
									{i + 1}
								</span>
								<span class="flex-1 text-sm text-gray-800 dark:text-dark-text truncate">{word.word}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else if loading}
			<div class="px-4 py-4">
				<div class="grid grid-cols-2 gap-3">
					{#each Array(6) as _}
						<SkeletonCard />
					{/each}
				</div>
			</div>
		{:else}
			<!-- 搜索结果 -->
			<div class="px-4 py-4">
				{#if error}
					<div class="flex flex-col items-center justify-center py-12">
						<div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
							<svg class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400">{error}</p>
						<button
							onclick={() => handleSearch(keyword)}
							class="mt-3 px-4 py-2 text-sm text-bilibili font-medium"
						>
							重试
						</button>
					</div>
				{:else if searchResults.length === 0}
					<div class="flex flex-col items-center justify-center py-12">
						<div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
							<svg class="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
							</svg>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400">未找到"{keyword}"相关内容</p>
						<p class="text-xs text-gray-400 mt-1">换个关键词试试</p>
					</div>
				{:else}
					<p class="text-xs text-gray-400 mb-4">
						找到 <span class="text-bilibili font-medium">{searchResults.length}</span> 个与"<span class="text-gray-600 dark:text-gray-300">{keyword}</span>"相关的结果
					</p>
					<div class="grid grid-cols-2 gap-3">
						{#each searchResults as video, i (video.id)}
							<VideoCard {video} index={i} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<NavBar />
</div>
