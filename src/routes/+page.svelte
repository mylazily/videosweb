<script lang="ts">
	/**
	 * 首页 - 性能优化版
	 * 立即显示骨架屏，异步加载数据
	 */
	import { onMount } from 'svelte';
	import type { Video } from '$lib/types';
	import HeaderBar from '$components/HeaderBar.svelte';
	import NavBar from '$components/NavBar.svelte';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import PullRefresh from '$components/PullRefresh.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';
	import VideoCard from '$components/VideoCard.svelte';
	import LoadingSpinner from '$components/LoadingSpinner.svelte';
	import { getBaseUrl } from '$lib/apiConfig';
	import { API_TIMEOUT } from '$lib/constants';

	// 状态 - 立即显示骨架屏
	let allVideos = $state<Video[]>([]);
	let loading = $state(true);
	let hasMore = $state(true);
	let currentPage = $state(1);
	let mounted = $state(false);

	/** 带超时的 fetch */
	async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);
		try {
			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);
			return response;
		} catch {
			clearTimeout(timeoutId);
			throw new Error('Timeout');
		}
	}

	/** 加载首页数据 */
	async function loadHomeData() {
		try {
			const base = getBaseUrl();
			const [hotRes, latestRes, randomRes] = await Promise.allSettled([
				fetchWithTimeout(`${base}/api/v1/videos/hot?page=1&page_size=12`, 3000),
				fetchWithTimeout(`${base}/api/v1/videos/latest?page=1&page_size=12`, 3000),
				fetchWithTimeout(`${base}/api/v1/videos/random?page_size=6`, 3000)
			]);

			const videos: Video[] = [];
			if (hotRes.status === 'fulfilled' && hotRes.value.ok) {
				const data = await hotRes.value.json();
				videos.push(...(data.data?.list || data.data || []));
			}
			if (latestRes.status === 'fulfilled' && latestRes.value.ok) {
				const data = await latestRes.value.json();
				videos.push(...(data.data?.list || data.data || []));
			}
			if (randomRes.status === 'fulfilled' && randomRes.value.ok) {
				const data = await randomRes.value.json();
				videos.push(...(data.data?.list || data.data || []));
			}
			if (videos.length > 0) {
				allVideos = videos;
			}
		} catch {
			// 加载失败
		} finally {
			loading = false;
		}
	}

	// 立即开始加载（不等待 onMount）
	loadHomeData();

	onMount(() => {
		mounted = true;
	});

	// 下拉刷新
	async function handleRefresh() {
		loading = true;
		currentPage = 1;
		hasMore = true;
		await loadHomeData();
	}

	// 加载更多
	async function handleLoadMore() {
		if (loading || !hasMore) return;
		loading = true;
		currentPage++;

		try {
			const base = getBaseUrl();
			const response = await fetchWithTimeout(`${base}/api/v1/videos/hot?page=${currentPage}&page_size=10`, 3000);
			if (!response.ok) throw new Error('Failed');
			const data = await response.json();
			const newVideos: Video[] = data.data?.list || data.data || [];

			if (newVideos.length > 0) {
				allVideos = [...allVideos, ...newVideos];
			} else {
				hasMore = false;
			}
		} catch {
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	// 分类选择
	function handleCategorySelect(slug: string) {
		window.location.href = `/category/${slug}`;
	}
</script>

<svelte:head>
	<title>XVideos 影视 - 高清影视在线观看</title>
	<meta name="description" content="XVideos 影视聚合系统 - 在线观看最新电影、电视剧、动漫、综艺、短视频" />
	<!-- 预连接到API域名 -->
	<link rel="preconnect" href="https://9901.555554.xyz" />
	<link rel="dns-prefetch" href="https://9901.555554.xyz" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-dark-bg">
	<!-- 顶部导航 -->
	<HeaderBar />

	<!-- 分类标签 -->
	<CategoryTabs onSelect={handleCategorySelect} />

	<!-- 内容区域 -->
	<PullRefresh onRefresh={handleRefresh} {loading}>
		<div class="px-3 py-3">
			{#if allVideos.length === 0}
				{#if loading}
					<!-- 骨架屏 - 立即显示 -->
					<div class="grid grid-cols-2 gap-3">
						{#each Array(6) as _, i}
							<SkeletonCard />
						{/each}
					</div>
				{:else}
					<!-- 空状态 -->
					<div class="flex flex-col items-center justify-center py-20">
						<div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
							<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
							</svg>
						</div>
						<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">暂无内容</p>
						<button
							onclick={handleRefresh}
							class="px-4 py-2 text-sm text-bilibili font-medium"
						>
							点击刷新
						</button>
					</div>
				{/if}
			{:else}
				<!-- 视频网格 -->
				<div class="grid grid-cols-2 gap-3">
					{#each allVideos as video, i (video.id)}
						<VideoCard {video} index={i} />
					{/each}
				</div>

				<!-- 加载更多 -->
				{#if hasMore}
					<div class="flex justify-center py-6">
						{#if loading}
							<LoadingSpinner size="small" />
						{:else}
							<button
								onclick={handleLoadMore}
								class="flex items-center gap-2 px-6 py-2.5 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-card rounded-full shadow-sm hover:shadow transition-all active:scale-95"
							>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 5v14M5 12h14"/>
								</svg>
								加载更多
							</button>
						{/if}
					</div>
				{:else}
					<div class="flex justify-center py-6">
						<p class="text-xs text-gray-400">已经到底啦~</p>
					</div>
				{/if}
			{/if}
		</div>
	</PullRefresh>

	<!-- 底部导航 -->
	<NavBar />
</div>
