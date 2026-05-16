<script lang="ts">
	/**
	 * 分类列表页
	 */
	import type { Video, Category } from '$lib/types';
	import CategoryTabs from '$components/CategoryTabs.svelte';
	import VideoCard from '$components/VideoCard.svelte';
	import InfiniteScroll from '$components/InfiniteScroll.svelte';

	let { data } = $props();

	// 使用 $derived 保持响应性
	let slug = $derived(data.slug);
	let category = $derived<Category>(data.category);
	let videos = $state<Video[]>(data.videos);
	let loading = $state(false);
	let hasMore = $state(true);
	let pageNum = $state(1);

	// 加载更多
	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		pageNum++;

		try {
			const { getBaseUrl } = await import('$lib/apiConfig');
			const base = getBaseUrl();
			const res = await fetch(`${base}/api/v1/videos?category=${slug}&page=${pageNum}&page_size=10`);
			if (res.ok) {
				const data = await res.json();
				const moreVideos: Video[] = data.data?.list || data.data || [];
				videos = [...videos, ...moreVideos];
				hasMore = moreVideos.length >= 10;
			} else {
				hasMore = false;
			}
		} catch {
			hasMore = false;
		}
		loading = false;
	}

	// 切换分类
	function handleCategorySelect(newSlug: string) {
		window.location.href = `/category/${newSlug}`;
	}
</script>

<div class="pb-4 safe-bottom">
	<!-- 分类标签 -->
	<CategoryTabs activeSlug={slug} onSelect={handleCategorySelect} />

	<!-- 视频列表 -->
	<div class="px-4 mt-3">
		<h2 class="text-base font-bold text-gray-900 dark:text-dark-text mb-3">
			{category.name}
		</h2>

		{#if videos.length === 0}
			<div class="flex flex-col items-center py-16 text-gray-400">
				<p class="text-sm">暂无该分类的影视内容</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each videos as video (video.id)}
					<VideoCard {video} />
				{/each}
			</div>

			<InfiniteScroll {hasMore} {loading} onLoadMore={loadMore} />
		{/if}
	</div>
</div>
