<script lang="ts">
	/**
	 * 视频网格布局组件
	 * 支持竖向和横向布局
	 */
	import type { Video } from '$lib/types';
	import VideoCard from './VideoCard.svelte';

	interface Props {
		videos: Video[];
		horizontal?: boolean;
		columns?: number;
		showRating?: boolean;
		showPlayCount?: boolean;
	}

	let {
		videos = [],
		horizontal = false,
		columns = 2,
		showRating = true,
		showPlayCount = true
	}: Props = $props();

	// 网格列数样式
	const gridStyle = $derived(horizontal ? '' : `grid-template-columns: repeat(${columns}, 1fr);`);
</script>

{#if videos.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-gray-400">
		<svg class="w-16 h-16 mb-3 opacity-30" viewBox="0 0 24 24" fill="currentColor">
			<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
		</svg>
		<p class="text-sm">暂无内容</p>
	</div>
{:else if horizontal}
	<!-- 横向列表 -->
	<div class="flex flex-col gap-3">
		{#each videos as video (video.id)}
			<VideoCard {video} horizontal showRating={showRating} showPlayCount={showPlayCount} />
		{/each}
	</div>
{:else}
	<!-- 网格布局 -->
	<div class="grid gap-3" style={gridStyle}>
		{#each videos as video (video.id)}
			<VideoCard {video} {showRating} {showPlayCount} />
		{/each}
	</div>
{/if}
