<script lang="ts">
	/**
	 * 首页
	 * 小红书式瀑布流布局 + 分类标签 + 热门视频 + 最新更新
	 * 支持无限滚动加载
	 */
	import { page } from '$app/state';
	import type { Banner, Video } from '$lib/types';
	import VideoCard from '$components/VideoCard.svelte';
	import VideoCardPreview from '$components/VideoCardPreview.svelte';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import PullRefresh from '$components/PullRefresh.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';
	import WaterfallGrid from '$components/WaterfallGrid.svelte';
	import { getBaseUrl } from '$lib/apiConfig';

	let { data } = $props();

	// 轮播状态
	let currentBanner = $state(0);
	let banners = $state<Banner[]>(data.banners || []);
	let allVideos = $state<Video[]>([...(data.hotVideos || []), ...(data.latestVideos || [])]);
	let loading = $state(false);
	let hasMore = $state(true);
	let currentPage = $state(1);

	// 自动轮播
	let bannerTimer: ReturnType<typeof setInterval>;

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

	function startBannerTimer() {
		stopBannerTimer();
		bannerTimer = setInterval(() => {
			currentBanner = (currentBanner + 1) % banners.length;
		}, 4000);
	}

	function stopBannerTimer() {
		if (bannerTimer) clearInterval(bannerTimer);
	}

	// 下拉刷新
	async function handleRefresh() {
		loading = true;
		try {
			const base = getBaseUrl();
			const [bannerRes, hotRes, latestRes] = await Promise.allSettled([
				fetch(`${base}/api/home/banner`),
				fetch(`${base}/api/video/hot?page=1&page_size=10`),
				fetch(`${base}/api/video/latest?page=1&page_size=10`)
			]);

			if (bannerRes.status === 'fulfilled' && bannerRes.value.ok) {
				const data = await bannerRes.value.json();
				banners = data.data || data.banners || [];
			}
			if (hotRes.status === 'fulfilled' && hotRes.value.ok) {
				const data = await hotRes.value.json();
				const hotVideos = data.data?.list || data.data || [];
				allVideos = [...hotVideos];
			}
			if (latestRes.status === 'fulfilled' && latestRes.value.ok) {
				const data = await latestRes.value.json();
				const latestVideos = data.data?.list || data.data || [];
				allVideos = [...allVideos, ...latestVideos];
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
			const response = await fetch(`${base}/api/video/hot?page=${currentPage}&page_size=10`);
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
		// 跳转到分类页
		window.location.href = `/category/${slug}`;
	}

	// 生命周期
	$effect(() => {
		if (banners.length > 0) {
			startBannerTimer();
		}
		return () => stopBannerTimer();
	});
</script>

<PullRefresh onRefresh={handleRefresh} {loading} />

<div class="pb-4 safe-bottom">
	<!-- 轮播 Banner -->
	{#if banners.length > 0}
		<div class="relative overflow-hidden" style="height: 180px;">
			<div
				class="flex transition-transform duration-500 ease-out h-full"
				style="transform: translateX(-{currentBanner * 100}%);"
			>
				{#each banners as banner}
					<a href={banner.link} class="flex-shrink-0 w-full h-full relative">
						<img
							src={banner.cover}
							alt={banner.title}
							class="w-full h-full object-cover"
							referrerpolicy="no-referrer"
						/>
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
							<h2 class="text-white text-base font-bold">{banner.title}</h2>
							<p class="text-white/70 text-xs mt-1">{banner.description}</p>
						</div>
					</a>
				{/each}
			</div>

			<!-- 指示器 -->
			<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
				{#each banners as _, i}
					<button
						class="h-1.5 rounded-full transition-all duration-300"
						class:w-4={i === currentBanner}
						class:w-1.5={i !== currentBanner}
						class:bg-white={i === currentBanner}
						class:bg-white-opacity-40={i !== currentBanner}
						aria-label="切换到第{i + 1}张轮播图"
						onclick={() => currentBanner = i}
					></button>
				{/each}
			</div>
		</div>
	{/if}

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
									{#if video.tags.length > 0}
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
	.bg-white-opacity-40 {
		background-color: rgba(255, 255, 255, 0.4);
	}

	.waterfall-item {
		break-inside: avoid;
		margin-bottom: 8px;
	}
</style>
