<script lang="ts">
	/**
	 * 搜索页
	 * 搜索框 + 热搜词 + 搜索结果列表
	 * 使用真实 API 调用替换模拟数据
	 */
	import type { HotWord, Video } from '$lib/types';
	import { getBaseUrl } from '$lib/apiConfig';
	import SearchBar from '$components/SearchBar.svelte';
	import VideoCard from '$components/VideoCard.svelte';
	import LoadingSpinner from '$components/LoadingSpinner.svelte';

	let { data } = $props();

	let hotWords = $state<HotWord[]>(data.hotWords || []);
	let searchResults = $state<Video[]>([]);
	let keyword = $state('');
	let isSearching = $state(false);
	let hasSearched = $state(false);
	let loading = $state(false);
	let error = $state('');

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
			const response = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(keyword)}&page=1&page_size=20`);

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
				{#if error}
					<div class="px-3 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
						{error}
					</div>
				{:else}
					<p class="text-xs text-gray-400 mb-3">
						找到 {searchResults.length} 个与"{keyword}"相关的结果
					</p>
				{/if}
				<div class="grid grid-cols-2 gap-3">
					{#each searchResults as video (video.id)}
						<VideoCard {video} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
