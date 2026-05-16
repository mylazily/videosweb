<script lang="ts">
	/**
	 * 首页
	 * 小红书式瀑布流布局 + 分类标签 + 热门视频 + 最新更新
	 * 支持无限滚动加载
	 *
	 * 数据来源（与后端 router.go 严格对应）：
	 * - hotVideos: GET /api/v1/videos/hot
	 * - latestVideos: GET /api/v1/videos/latest
	 * - randomVideos: GET /api/v1/videos/random
	 * - hotWords: GET /api/v1/search/hot
	 */
	import type { Video } from '$lib/types';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import PullRefresh from '$components/PullRefresh.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';
	import WaterfallGrid from '$components/WaterfallGrid.svelte';
	import { getBaseUrl } from '$lib/apiConfig';

	let { data } = $props();

	// 合并热门 + 最新 + 随机推荐作为瀑布流数据源
	let allVideos = $state<Video[]>([
		...(data.hotVideos || []),
		...(data.latestVideos || []),
		...(data.randomVideos || [])
	]);
	let loading = $state(false);
	let hasMore = $state(true);
	let currentPage = $state(1);

	/** 基于 video id 的确定性哈希函数，避免 Math.random() 导致布局闪烁 */
	function hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash |= 0;
		}
		return Math.abs(hash);
	}

	// 下拉刷新
	async function handleRefresh() {
		loading = true;
		try {
			const base = getBaseUrl();
			const [hotRes, latestRes, randomRes] = await Promise.allSettled([
				fetch(`${base}/api/v1/videos/hot?page=1&page_size=12`),
				fetch(`${base}/api/v1/videos/latest?page=1&page_size=12`),
				fetch(`${base}/api/v1/videos/random?page_size=6`)
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
				currentPage = 1;
				hasMore = true;
			}
		} catch {
			// Refresh failed, keep existing data
		} finally {
			loading = false;
		}
	}

	// 加载更多
	async function handleLoadMore() {
		if (loading || !hasMore) return;
		loading = true;
		currentPage++;

		try {
			const base = getBaseUrl();
			const response = await fetch(`${base}/api/v1/videos/hot?page=${currentPage}&page_size=10`);
			if (!response.ok) throw new Error('Failed to load');
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

<PullRefresh onRefresh={handleRefresh} {loading} />

<div class="pb-4 safe-bottom">
	<!-- 分类标签 -->
	<div class="mt-3">
		<CategoryTabs onSelect={handleCategorySelect} />
	</div>

	<!-- 小红书式瀑布流视频列表 -->
	<div class="mt-4">
		<div class="px-4 mb-3">
			<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
				<span class="text-bilibili mr-1">&#128293;</span>推荐
			</h2>
		</div>

		{#if loading && allVideos.length === 0}
			<div class="grid grid-cols-2 gap-3 px-4">
				{#each Array(6) as _}
					<SkeletonCard />
				{/each}
			</div>
		{:else}
			<WaterfallGrid
				items={allVideos}
				{loading}
				{hasMore}
				onLoadMore={handleLoadMore}
			>
				{#snippet item(video)}
					<div class="waterfall-item">
						<a href="/v/{video.id}" class="block rounded-xl overflow-hidden bg-white dark:bg-dark-card shadow-sm">
							<!-- 封面图（瀑布流高度自适应） -->
							<div class="relative">
								<img
									src={video.cover}
									alt={video.title}
									class="w-full object-cover"
									style="height: {150 + (hashCode(video.id) % 100)}px;"
									referrerpolicy="no-referrer"
									loading="lazy"
								/>
								<!-- 播放量 -->
								<span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[10px] text-white bg-black/60 rounded">
									{video.play_count > 10000 ? `${Math.floor(video.play_count / 10000)}万` : video.play_count}
								</span>
							</div>
							<!-- 标题和标签 -->
							<div class="p-2">
								<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text leading-tight">
									{video.title}
								</h3>
								<div class="flex items-center justify-between mt-1.5">
									{#if video.rating > 0}
										<span class="text-xs text-orange-500 font-medium">
											{video.rating}分
										</span>
									{:else}
										<span class="text-xs text-gray-400">{video.category}</span>
									{/if}
									{#if video.tags && video.tags.length > 0}
										<span class="text-[10px] text-gray-400">#{video.tags[0]}</span>
									{/if}
								</div>
							</div>
						</a>
					</div>
				{/snippet}
			</WaterfallGrid>
		{/if}
	</div>
</div>

<style>
	.waterfall-item {
		break-inside: avoid;
		margin-bottom: 8px;
	}
</style>
