<script lang="ts">
	/**
	 * 首页
	 * 轮播 Banner + 分类标签 + 热门视频 + 最新更新
	 */
	import { page } from '$app/state';
	import type { Banner, Video } from '$lib/types';
	import VideoCard from '$components/VideoCard.svelte';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import PullRefresh from '$components/PullRefresh.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';

	let { data } = $props();

	// 轮播状态
	let currentBanner = $state(0);
	let banners = $state<Banner[]>(data.banners || []);
	let hotVideos = $state<Video[]>(data.hotVideos || []);
	let latestVideos = $state<Video[]>(data.latestVideos || []);
	let loading = $state(false);

	// 自动轮播
	let bannerTimer: ReturnType<typeof setInterval>;

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
		// 模拟刷新
		await new Promise((resolve) => setTimeout(resolve, 1000));
		loading = false;
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

	<!-- 热门推荐 -->
	<div class="mt-4 px-4">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
				<span class="text-bilibili mr-1">&#128293;</span>热门推荐
			</h2>
			<a href="/rank" class="text-xs text-gray-400">查看更多 &#8250;</a>
		</div>

		{#if loading}
			<div class="grid grid-cols-2 gap-3">
				{#each Array(4) as _}
					<SkeletonCard />
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each hotVideos as video (video.id)}
					<VideoCard {video} />
				{/each}
			</div>
		{/if}
	</div>

	<!-- 最新更新 -->
	<div class="mt-6 px-4">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
				<span class="text-bilibili mr-1">&#128337;</span>最新更新
			</h2>
			<a href="/category/movie" class="text-xs text-gray-400">查看更多 &#8250;</a>
		</div>

		<div class="space-y-3">
			{#each latestVideos as video (video.id)}
				<VideoCard {video} horizontal />
			{/each}
		</div>
	</div>
</div>

<style>
	.bg-white-opacity-40 {
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>
