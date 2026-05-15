<script lang="ts">
	/**
	 * 视频卡片组件
	 * 显示封面 + 标题 + 标签 + 评分
	 * 使用 LazyImage 实现图片懒加载
	 */
	import type { Video } from '$lib/types';
	import { formatPlayCount, formatRating } from '$lib/utils';
	import LazyImage from '$components/LazyImage.svelte';

	interface Props {
		video: Video;
		showRating?: boolean;
		showPlayCount?: boolean;
		horizontal?: boolean;
	}

	let {
		video,
		showRating = true,
		showPlayCount = true,
		horizontal = false
	}: Props = $props();
</script>

<a href="/video/{video.id}" class="card block">
	{#if horizontal}
		<!-- 横向卡片 -->
		<div class="flex gap-3 p-2">
			<div class="cover-16-9 w-[140px] flex-shrink-0 rounded-md">
				<LazyImage
					src={video.cover}
					alt={video.title}
					width="100%"
					height="100%"
					rounded="rounded-md"
				/>
				{#if showPlayCount}
					<span class="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] text-white bg-black/60 rounded">
						{formatPlayCount(video.play_count)}
					</span>
				{/if}
			</div>
			<div class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
				<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text">
					{video.title}
				</h3>
				<div class="flex items-center gap-2">
					{#if showRating && video.rating > 0}
						<span class="text-xs text-orange-500 font-medium">
							{formatRating(video.rating)}分
						</span>
					{/if}
					<span class="text-xs text-gray-400">{video.year}</span>
				</div>
				{#if video.tags.length > 0}
					<div class="flex gap-1 flex-wrap">
						{#each video.tags.slice(0, 3) as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- 竖向卡片 -->
		<div class="cover-16-9">
			<LazyImage
				src={video.cover}
				alt={video.title}
				width="100%"
				height="100%"
			/>
			{#if showPlayCount}
				<span class="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] text-white bg-black/60 rounded">
					{formatPlayCount(video.play_count)}
				</span>
			{/if}
		</div>
		<div class="p-2">
			<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text leading-tight">
				{video.title}
			</h3>
			<div class="flex items-center justify-between mt-1.5">
				{#if showRating && video.rating > 0}
					<span class="text-xs text-orange-500 font-medium">
						{formatRating(video.rating)}分
					</span>
				{:else}
					<span class="text-xs text-gray-400">{video.category}</span>
				{/if}
				{#if video.update_time}
					<span class="text-[10px] text-gray-400">{video.update_time}</span>
				{/if}
			</div>
		</div>
	{/if}
</a>
