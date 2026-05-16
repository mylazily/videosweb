<script lang="ts">
	/**
	 * 猜你喜欢推荐瀑布流组件
	 * 在视频详情页底部显示相关推荐视频
	 * 调用 /api/v1/videos/:id/related 获取推荐
	 */
	import { onMount } from 'svelte';
	import type { RecommendVideo } from '$lib/types';
	import { formatPlayCount, formatRating } from '$lib/utils';
	import VideoCardPreview from '$components/VideoCardPreview.svelte';

	interface Props {
		videoId: string;
	}

	let { videoId }: Props = $props();

	// 推荐数据
	let videos = $state<RecommendVideo[]>([]);
	let loading = $state(false);
	let hasMore = $state(true);
	let pageNum = $state(1);

	// 加载推荐视频
	async function loadRecommendations(reset = false) {
		if (loading) return;
		loading = true;

		try {
			const params = new URLSearchParams({
				page: String(pageNum),
				page_size: '10'
			});
			const res = await fetch(`/api/v1/videos/${videoId}/related?${params}`);
			const data = await res.json();

			const newVideos: RecommendVideo[] = data.data?.list || data.videos || [];

			if (reset) {
				videos = newVideos;
			} else {
				videos = [...videos, ...newVideos];
			}

			hasMore = newVideos.length >= 10;
		} catch {
			// 加载失败时返回空列表
			if (reset) {
				videos = [];
			}
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	// 加载更多
	function loadMore() {
		if (!hasMore || loading) return;
		pageNum++;
		loadRecommendations();
	}

	// IntersectionObserver 实现无限滚动
	let sentinel: HTMLElement;

	onMount(() => {
		loadRecommendations(true);

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);

		if (sentinel) observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div class="mt-4 px-4">
	<!-- 标题 -->
	<div class="flex items-center gap-2 mb-3">
		<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
			<span class="text-bilibili mr-1">&#10024;</span>猜你喜欢
		</h2>
	</div>

	{#if loading && videos.length === 0}
		<!-- 首次加载骨架屏 -->
		<div class="grid grid-cols-2 gap-3">
			{#each Array(4) as _}
				<div class="card animate-pulse">
					<div class="w-full h-0 pt-[56.25%] skeleton-shimmer rounded-t-lg"></div>
					<div class="p-2 space-y-1.5">
						<div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
						<div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if videos.length > 0}
		<!-- 推荐视频网格 -->
		<div class="grid grid-cols-2 gap-3">
			{#each videos as video (video.id)}
				<a href="/v/{video.id}" class="card block">
					<div class="cover-16-9">
						<img
							src={video.cover}
							alt={video.title}
							loading="lazy"
							referrerpolicy="no-referrer"
						/>
						{#if video.reason}
							<span class="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] text-white bg-bilibili/80 rounded">
								{video.reason}
							</span>
						{/if}
						<span class="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] text-white bg-black/60 rounded">
							{formatPlayCount(video.play_count)}
						</span>
					</div>
					<div class="p-2">
						<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text leading-tight">
							{video.title}
						</h3>
						<div class="flex items-center gap-2 mt-1">
							{#if video.rating > 0}
								<span class="text-xs text-orange-500 font-medium">
									{formatRating(video.rating)}分
								</span>
							{/if}
							{#if video.tags.length > 0}
								<span class="text-[10px] text-gray-400">{video.tags[0]}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>

		<!-- 无限滚动哨兵 -->
		{#if hasMore}
			<div bind:this={sentinel} class="flex items-center justify-center py-4">
				{#if loading}
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 border-2 border-bilibili/30 border-t-bilibili rounded-full animate-spin"></div>
						<span class="text-xs text-gray-400">加载更多推荐...</span>
					</div>
				{:else}
					<span class="text-xs text-gray-400">上拉加载更多</span>
				{/if}
			</div>
		{/if}
	{/if}
</div>
