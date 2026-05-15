<script lang="ts">
	/**
	 * 分类列表页
	 */
	import type { Video, Category } from '$lib/types';
	import CategoryTabs from '$lib/components/CategoryTabs.svelte';
	import VideoGrid from '$lib/components/VideoGrid.svelte';
	import SkeletonCard from '$lib/components/SkeletonCard.svelte';
	import InfiniteScroll from '$lib/components/InfiniteScroll.svelte';

	let { data } = $props();

	let slug = $state(data.slug);
	let category = $state<Category>(data.category);
	let videos = $state<Video[]>(data.videos);
	let loading = $state(false);
	let hasMore = $state(true);
	let page = $state(1);

	// 加载更多
	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		page++;

		// 模拟加载
		await new Promise((resolve) => setTimeout(resolve, 800));

		const moreVideos: Video[] = Array.from({ length: 10 }, (_, i) => ({
			id: `cat_${slug}_more_${page}_${i}`,
			title: `${category.name} - 更多作品 ${page * 10 + i + 1}`,
			cover: `https://picsum.photos/seed/${slug}more${page}${i}/400/225`,
			description: '更多精彩内容',
			director: '导演',
			actors: ['演员A'],
			year: 2024,
			area: '中国',
			category: category.name,
			tags: ['推荐'],
			rating: 4 + Math.random() * 6,
			play_count: Math.floor(Math.random() * 500000),
			comment_count: Math.floor(Math.random() * 5000),
			update_time: '2024-12-01',
			sources: []
		}));

		videos = [...videos, ...moreVideos];

		// 模拟最多 5 页
		if (page >= 5) hasMore = false;
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
