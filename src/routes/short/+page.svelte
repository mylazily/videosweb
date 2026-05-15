<script lang="ts">
	/**
	 * 短视频专区页面
	 * B站短视频区风格的卡片列表布局
	 * 顶部横向分类标签 + 瀑布流/网格布局 + 无限滚动 + 下拉刷新
	 */
	import type { ShortVideo } from '$lib/types';
	import { formatPlayCount, formatDuration } from '$lib/utils';
	import PreviewThumbnail from '$components/PreviewThumbnail.svelte';
	import PullRefresh from '$components/PullRefresh.svelte';
	import SkeletonCard from '$components/SkeletonCard.svelte';

	let { data } = $props();

	// 数据状态
	let shorts = $state<ShortVideo[]>(data.shorts || []);
	let activeSort = $state(data.sort || 'popular');
	let loading = $state(false);
	let hasMore = $state(data.hasMore);
	let pageNum = $state(data.page || 1);
	let refreshing = $state(false);

	// 排序选项
	const sortOptions = [
		{ value: 'popular', label: '推荐' },
		{ value: 'latest', label: '最新' },
		{ value: 'random', label: '热门' },
		{ value: 'random2', label: '随机' }
	] as const;

	// 切换排序
	function handleSortChange(sort: string) {
		activeSort = sort;
		pageNum = 1;
		hasMore = true;
		loadShorts(true);
	}

	// 加载短视频列表
	async function loadShorts(reset = false) {
		if (loading) return;
		loading = true;

		try {
			const params = new URLSearchParams({
				sort: activeSort === 'random2' ? 'random' : activeSort,
				page: String(pageNum)
			});
			const res = await fetch(`/short?${params}`);
			const data = await res.json();

			if (reset) {
				shorts = data.shorts || [];
			} else {
				shorts = [...shorts, ...(data.shorts || [])];
			}
			hasMore = data.hasMore;
		} catch {
			// 加载失败静默处理
		} finally {
			loading = false;
		}
	}

	// 加载更多
	async function loadMore() {
		if (!hasMore || loading) return;
		pageNum++;
		await loadShorts();
	}

	// 下拉刷新
	async function handleRefresh() {
		refreshing = true;
		pageNum = 1;
		hasMore = true;
		await loadShorts(true);
		refreshing = false;
	}

	// IntersectionObserver 实现无限滚动
	let sentinel: HTMLElement;
	import { onMount } from 'svelte';

	onMount(() => {
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

<PullRefresh onRefresh={handleRefresh} loading={refreshing} />

<div class="pb-4 safe-bottom">
	<!-- 顶部排序标签 -->
	<div class="px-4 pt-3 pb-2">
		<div class="flex gap-2 overflow-x-auto hide-scrollbar">
			{#each sortOptions as option}
				<button
					onclick={() => handleSortChange(option.value)}
					class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 btn-press"
					class:bg-bilibili={activeSort === option.value}
					class:text-white={activeSort === option.value}
					class:bg-gray-100={activeSort !== option.value}
					class:dark:bg-dark-border={activeSort !== option.value}
					class:text-gray-600={activeSort !== option.value}
					class:dark:text-dark-text-secondary={activeSort !== option.value}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- 短视频瀑布流/网格布局 -->
	<div class="px-3 mt-2">
		{#if loading && shorts.length === 0}
			<!-- 首次加载骨架屏 -->
			<div class="grid grid-cols-2 gap-2.5">
				{#each Array(6) as _}
					<div class="card animate-pulse">
						<div class="w-full h-0 pt-[130%] skeleton-shimmer rounded-t-lg"></div>
						<div class="p-2 space-y-1.5">
							<div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
							<div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-2.5">
				{#each shorts as short (short.id)}
					<a href="/short/{short.id}" class="card block">
						<!-- 封面（竖版 9:16 比例） -->
						<div class="relative w-full" style="padding-top: 130%;">
							<PreviewThumbnail
								src={short.cover}
								previewUrl={short.preview_url}
								alt={short.title}
								class="absolute inset-0 rounded-t-lg"
							/>

							<!-- 时长标签 -->
							<span class="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] text-white bg-black/70 rounded">
								{formatDuration(short.duration)}
							</span>

							<!-- 播放量 -->
							<span class="absolute bottom-2 left-2 px-1.5 py-0.5 text-[10px] text-white bg-black/70 rounded flex items-center gap-0.5">
								<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8 5v14l11-7z"/>
								</svg>
								{formatPlayCount(short.play_count)}
							</span>
						</div>

						<!-- 标题 -->
						<div class="p-2">
							<h3 class="text-xs font-medium line-clamp-2 text-gray-900 dark:text-dark-text leading-tight">
								{short.title}
							</h3>
							<div class="flex items-center gap-1.5 mt-1.5">
								<img
									src={short.author.avatar}
									alt={short.author.username}
									class="w-4 h-4 rounded-full"
									referrerpolicy="no-referrer"
									loading="lazy"
								/>
								<span class="text-[10px] text-gray-400 truncate">{short.author.username}</span>
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
							<span class="text-xs text-gray-400">加载更多...</span>
						</div>
					{:else}
						<span class="text-xs text-gray-400">上拉加载更多</span>
					{/if}
				</div>
			{:else}
				<div class="flex items-center justify-center py-4">
					<span class="text-xs text-gray-400">-- 已经到底了 --</span>
				</div>
			{/if}
		{/if}
	</div>
</div>
