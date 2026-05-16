<script lang="ts">
	/**
	 * 视频卡片组件 - 商业级优化版
	 * 显示封面 + 标题 + 标签 + 评分
	 * 使用 LazyImage 实现图片懒加载，添加悬停效果
	 */
	import type { Video } from '$lib/types';
	import { formatPlayCount, formatRating } from '$lib/utils';
	import LazyImage from '$components/LazyImage.svelte';

	interface Props {
		video: Video;
		showRating?: boolean;
		showPlayCount?: boolean;
		horizontal?: boolean;
		index?: number;
	}

	let {
		video,
		showRating = true,
		showPlayCount = true,
		horizontal = false,
		index = 0
	}: Props = $props();

	// 悬停状态
	let isHovered = $state(false);
	
	// 计算动画延迟
	const animationDelay = $derived(index * 50);
</script>

<a 
	href="/v/{video.id}" 
	class="card block group animate-fade-in"
	style="animation-delay: {animationDelay}ms;"
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
>
	{#if horizontal}
		<!-- 横向卡片 -->
		<div class="flex gap-3 p-2 transition-all duration-200 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 rounded-xl">
			<div class="cover-16-9 w-[140px] flex-shrink-0 rounded-lg overflow-hidden relative">
				<LazyImage
					src={video.cover}
					alt={video.title}
					width="100%"
					height="100%"
					rounded="rounded-lg"
				/>
				<!-- 播放量 -->
				{#if showPlayCount}
					<div class="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-white bg-black/70 backdrop-blur-sm rounded">
						<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z"/>
						</svg>
						{formatPlayCount(video.play_count)}
					</div>
				{/if}
				<!-- 悬停遮罩 -->
				<div 
					class="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200"
					class:opacity-0={!isHovered}
					class:opacity-100={isHovered}
				>
					<div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
						<svg class="w-5 h-5 text-bilibili ml-0.5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z"/>
						</svg>
					</div>
				</div>
			</div>
			<div class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
				<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text group-hover:text-bilibili transition-colors">
					{video.title}
				</h3>
				<div class="flex items-center gap-2 mt-1">
					{#if showRating && video.rating > 0}
						<span class="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
							<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							{formatRating(video.rating)}
						</span>
					{/if}
					<span class="text-xs text-gray-400">{video.year}</span>
				</div>
				{#if video.tags && video.tags.length > 0}
					<div class="flex gap-1 flex-wrap mt-1">
						{#each video.tags.slice(0, 2) as tag}
							<span class="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-gray-400 rounded">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- 竖向卡片 -->
		<div class="relative rounded-xl overflow-hidden bg-white dark:bg-dark-card shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
			<div class="cover-16-9 relative">
				<LazyImage
					src={video.cover}
					alt={video.title}
					width="100%"
					height="100%"
				/>
				<!-- 渐变遮罩 -->
				<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
				
				<!-- 播放量 -->
				{#if showPlayCount}
					<div class="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] text-white">
						<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z"/>
						</svg>
						{formatPlayCount(video.play_count)}
					</div>
				{/if}
				
				<!-- 评分 -->
				{#if showRating && video.rating > 0}
					<div class="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/90 backdrop-blur-sm rounded text-[10px] text-white font-medium">
						<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
						</svg>
						{formatRating(video.rating)}
					</div>
				{/if}
				
				<!-- 悬停播放按钮 -->
				<div 
					class="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200"
					class:opacity-0={!isHovered}
					class:opacity-100={isHovered}
				>
					<div class="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
						<svg class="w-6 h-6 text-bilibili ml-0.5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z"/>
						</svg>
					</div>
				</div>
			</div>
			<div class="p-3">
				<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text leading-snug group-hover:text-bilibili transition-colors">
					{video.title}
				</h3>
				<div class="flex items-center justify-between mt-2">
					<span class="text-xs text-gray-400">{video.category || '影视'}</span>
					{#if video.update_time}
						<span class="text-[10px] text-gray-400">{video.update_time}</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</a>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fade-in {
		animation: fade-in 0.4s ease-out forwards;
		opacity: 0;
	}
</style>
