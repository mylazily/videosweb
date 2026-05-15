<script lang="ts">
	/**
	 * 搜索页
	 * 搜索框 + 热搜词 + 搜索结果列表
	 */
	import { goto } from '$app/navigation';
	import type { HotWord, Video } from '$lib/types';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import VideoGrid from '$lib/components/VideoGrid.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { data } = $props();

	let hotWords = $state<HotWord[]>(data.hotWords || []);
	let searchResults = $state<Video[]>([]);
	let keyword = $state('');
	let isSearching = $state(false);
	let hasSearched = $state(false);
	let loading = $state(false);

	// 执行搜索
	async function handleSearch(kw: string) {
		if (!kw.trim()) return;
		keyword = kw.trim();
		isSearching = true;
		hasSearched = true;
		loading = true;

		// 模拟搜索 API 调用
		await new Promise((resolve) => setTimeout(resolve, 800));

		// 模拟搜索结果
		searchResults = Array.from({ length: 6 }, (_, i) => ({
			id: `search_${i}`,
			title: `${keyword} - 搜索结果 ${i + 1}`,
			cover: `https://picsum.photos/seed/search${i}/400/225`,
			description: `关于"${keyword}"的影视内容`,
			director: '导演' + (i + 1),
			actors: ['演员A', '演员B'],
			year: 2024,
			area: '中国',
			category: '电影',
			tags: ['热门'],
			rating: 4 + Math.random() * 6,
			play_count: Math.floor(Math.random() * 1000000),
			comment_count: Math.floor(Math.random() * 10000),
			update_time: '2024-12-01',
			sources: []
		}));

		loading = false;
	}

	// 点击热搜词
	function handleHotWordClick(word: string) {
		keyword = word;
		handleSearch(word);
	}
</script>

<div class="flex flex-col h-full">
	<!-- 搜索栏 -->
	<SearchBar bind:value={keyword} onSearch={handleSearch} autofocus />

	<!-- 搜索内容 -->
	<div class="flex-1 overflow-y-auto">
		{#if !hasSearched}
			<!-- 热搜榜 -->
			<div class="px-4 py-3">
				<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text mb-3">
					&#128293; 热搜榜
				</h3>
				<div class="space-y-1">
					{#each hotWords as word, i}
						<button
							onclick={() => handleHotWordClick(word.word)}
							class="flex items-center gap-3 w-full py-2.5 px-2 rounded-lg btn-press text-left"
						>
							<span class="w-5 text-center text-sm font-bold"
								class:text-red-500={i < 3}
								class:text-gray-400={i >= 3}
							>
								{i + 1}
							</span>
							<span class="flex-1 text-sm text-gray-800 dark:text-dark-text">{word.word}</span>
							<span class="text-[10px] text-gray-400">{word.hot > 10000 ? (word.hot / 10000).toFixed(1) + '万' : word.hot}</span>
						</button>
					{/each}
				</div>
			</div>
		{:else if loading}
			<LoadingSpinner text="搜索中..." />
		{:else}
			<!-- 搜索结果 -->
			<div class="px-4 py-3">
				<p class="text-xs text-gray-400 mb-3">
					找到 {searchResults.length} 个与"{keyword}"相关的结果
				</p>
				<VideoGrid videos={searchResults} />
			</div>
		{/if}
	</div>
</div>
