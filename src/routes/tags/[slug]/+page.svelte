<script lang="ts">
	/**
	 * 标签详情页
	 * 标签信息 + 视频瀑布流列表 + 分页加载
	 */
	import type { Tag, Video } from '$lib/types';
	import { formatPlayCount, setPageTitle } from '$lib/utils';
	import VideoCardPreview from '$components/VideoCardPreview.svelte';
	import InfiniteScroll from '$components/InfiniteScroll.svelte';

	let { data } = $props();

	// 标签和视频数据
	let tag = $state<Tag>(data.tag);
	let videos = $state<Video[]>(data.videos);
	let loading = $state(false);
	let hasMore = $state(true);
	let pageNum = $state(1);

	// 设置页面标题
	$effect(() => {
		setPageTitle(`${tag.name} - 标签`);
	});

	// 加载更多
	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		pageNum++;

		// 模拟加载
		await new Promise((resolve) => setTimeout(resolve, 800));

		const moreVideos: Video[] = Array.from({ length: 10 }, (_, i) => ({
			id: `tag_${tag.slug}_more_${pageNum}_${i}`,
			title: `${tag.name} - 更多作品 ${pageNum * 10 + i + 1}`,
			cover: `https://picsum.photos/seed/tag_${tag.slug}_more${pageNum}${i}/400/225`,
			description: `更多精彩的${tag.name}类影视作品`,
			director: '导演',
			actors: ['演员A', '演员B'],
			year: 2024,
			area: '中国',
			category: tag.name,
			tags: [tag.name, '推荐'],
			rating: 4 + Math.random() * 6,
			play_count: Math.floor(Math.random() * 500000),
			comment_count: Math.floor(Math.random() * 5000),
			update_time: '2024-12-01',
			sources: []
		}));

		videos = [...videos, ...moreVideos];

		// 模拟最多 5 页
		if (pageNum >= 5) hasMore = false;
		loading = false;
	}
</script>

<div class="pb-4 safe-bottom">
	<!-- 标签信息头部 -->
	<div class="px-4 pt-3 pb-4">
		<div class="flex items-center gap-3">
			{#if tag.cover}
				<img
					src={tag.cover}
					alt={tag.name}
					class="w-16 h-16 rounded-xl object-cover"
					referrerpolicy="no-referrer"
				/>
			{:else}
				<div class="w-16 h-16 rounded-xl bg-bilibili/10 flex items-center justify-center flex-shrink-0">
					<span class="text-bilibili text-2xl font-bold">{tag.name[0]}</span>
				</div>
			{/if}
			<div class="flex-1 min-w-0">
				<h1 class="text-lg font-bold text-gray-900 dark:text-dark-text">
					{tag.name}
				</h1>
				{#if tag.description}
					<p class="text-xs text-gray-500 dark:text-dark-text-secondary mt-1 line-clamp-2">
						{tag.description}
					</p>
				{/if}
				<span class="text-xs text-bilibili mt-1 inline-block">
					共 {formatPlayCount(tag.video_count)} 个视频
				</span>
			</div>
		</div>
	</div>

	<!-- 分割线 -->
	<div class="h-px bg-gray-100 dark:bg-dark-border"></div>

	<!-- 视频列表 -->
	<div class="px-4 mt-3">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-bold text-gray-900 dark:text-dark-text">
				相关视频
			</h2>
			<span class="text-xs text-gray-400">共 {videos.length} 个</span>
		</div>

		{#if videos.length === 0}
			<div class="flex flex-col items-center py-16 text-gray-400">
				<svg class="w-16 h-16 mb-3 opacity-30" viewBox="0 0 24 24" fill="currentColor">
					<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
				</svg>
				<p class="text-sm">暂无该标签的视频</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				{#each videos as video (video.id)}
					<VideoCardPreview {video} />
				{/each}
			</div>

			<InfiniteScroll {hasMore} {loading} onLoadMore={loadMore} />
		{/if}
	</div>
</div>
