<script lang="ts">
	import { onMount } from 'svelte';
	import type { Video } from '$lib/types';
	import HeaderBar from '$components/HeaderBar.svelte';
	import NavBar from '$components/NavBar.svelte';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import VideoCard from '$components/VideoCard.svelte';
	import { getBaseUrl } from '$lib/apiConfig';
	import { API_TIMEOUT } from '$lib/constants';

	let allVideos = $state<Video[]>([]);
	let loading = $state(true);
	let hasMore = $state(true);
	let currentPage = $state(1);

	async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);
		try {
			const res = await fetch(url, { signal: controller.signal });
			clearTimeout(id);
			return res;
		} catch {
			clearTimeout(id);
			throw new Error('timeout');
		}
	}

	async function loadHomeData() {
		try {
			const base = getBaseUrl();
			const [hotRes, latestRes, randomRes] = await Promise.allSettled([
				fetchWithTimeout(`${base}/api/v1/videos/hot?page=1&page_size=12`, 3000),
				fetchWithTimeout(`${base}/api/v1/videos/latest?page=1&page_size=12`, 3000),
				fetchWithTimeout(`${base}/api/v1/videos/random?page_size=6`, 3000)
			]);
			const videos: Video[] = [];
			for (const res of [hotRes, latestRes, randomRes]) {
				if (res.status === 'fulfilled' && res.value.ok) {
					const data = await res.value.json();
					videos.push(...(data.data?.list || data.data || []));
				}
			}
			if (videos.length > 0) allVideos = videos;
		} catch {
			// silent
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadHomeData();
	});

	async function handleLoadMore() {
		if (loading || !hasMore) return;
		loading = true;
		currentPage++;
		try {
			const base = getBaseUrl();
			const res = await fetchWithTimeout(`${base}/api/v1/videos/hot?page=${currentPage}&page_size=10`, 3000);
			if (!res.ok) throw new Error();
			const data = await res.json();
			const list: Video[] = data.data?.list || data.data || [];
			if (list.length > 0) allVideos = [...allVideos, ...list];
			else hasMore = false;
		} catch {
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	function handleCategorySelect(slug: string) {
		if (slug) window.location.href = `/category/${slug}`;
	}
</script>

<svelte:head>
	<title>XVideos 影视 - 高清影视在线观看</title>
	<meta name="description" content="XVideos 影视聚合系统 - 在线观看最新电影、电视剧、动漫、综艺、短视频" />
	<link rel="preconnect" href="https://9901.555554.xyz" />
	<link rel="dns-prefetch" href="https://9901.555554.xyz" />
</svelte:head>

<div class="min-h-screen bg-[#f4f4f4]">
	<HeaderBar />
	<CategoryTabs onSelect={handleCategorySelect} />

	<div class="px-2.5 pt-2 pb-24">
		{#if loading && allVideos.length === 0}
			<!-- 骨架屏 -->
			<div class="grid grid-cols-2 gap-x-2.5 gap-y-3">
				{#each Array(6) as _}
					<div class="bg-white rounded-lg overflow-hidden">
						<div class="w-full aspect-[3/4] bg-gray-200 animate-pulse"></div>
						<div class="p-2 space-y-1.5">
							<div class="h-3.5 bg-gray-200 rounded animate-pulse w-full"></div>
							<div class="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if allVideos.length === 0}
			<!-- 空状态 -->
			<div class="flex flex-col items-center justify-center py-24">
				<div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
					<svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
					</svg>
				</div>
				<p class="text-sm text-gray-400 mb-3">暂无内容</p>
				<button
					onclick={() => { loading = true; loadHomeData(); }}
					class="px-5 py-2 text-sm text-white bg-[#FB7299] rounded-full active:scale-95 transition-transform"
				>
					点击刷新
				</button>
			</div>
		{:else}
			<!-- 视频网格 -->
			<div class="grid grid-cols-2 gap-x-2.5 gap-y-3">
				{#each allVideos as video, i (video.id)}
					<VideoCard {video} index={i} />
				{/each}
			</div>

			{#if hasMore}
				<div class="flex justify-center py-6">
					{#if loading}
						<div class="flex items-center gap-2 text-sm text-gray-400">
							<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20"></circle>
								<path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
							</svg>
							加载中...
						</div>
					{:else}
						<button
							onclick={handleLoadMore}
							class="px-6 py-2 text-sm text-gray-500 bg-white rounded-full shadow-sm active:scale-95 transition-transform"
						>
							加载更多
						</button>
					{/if}
				</div>
			{:else}
				<div class="text-center py-6">
					<p class="text-xs text-gray-400">— 已经到底啦 —</p>
				</div>
			{/if}
		{/if}
	</div>

	<NavBar />
</div>
