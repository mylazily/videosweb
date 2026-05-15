<script lang="ts">
	/**
	 * 动态封面预览组件
	 * 基于 VideoCard 增强，添加鼠标悬停动态预览
	 * 支持预加载、骨架动画、静默降级
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

	// 预览状态
	let isHovering = $state(false);
	let previewLoaded = $state(false);
	let previewFailed = $state(false);
	let showPreview = $derived(isHovering && previewLoaded && !previewFailed);

	// 预加载预览图
	let preloadImg: HTMLImageElement | null = null;

	function handleMouseEnter() {
		if (!video.preview_url && !(video as Video & { preview_url?: string }).preview_url) return;
		isHovering = true;

		// 如果预览图未加载，开始加载
		if (!previewLoaded && !previewFailed) {
			loadPreview();
		}
	}

	function handleMouseLeave() {
		isHovering = false;
	}

	function loadPreview() {
		const previewUrl = (video as Video & { preview_url?: string }).preview_url;
		if (!previewUrl) return;

		preloadImg = new Image();
		preloadImg.referrerPolicy = 'no-referrer';
		preloadImg.onload = () => {
			previewLoaded = true;
		};
		preloadImg.onerror = () => {
			previewFailed = true;
		};
		preloadImg.src = previewUrl;
	}

	// 当前显示的封面地址
	const displayCover = $derived(
		showPreview && (video as Video & { preview_url?: string }).preview_url
			? (video as Video & { preview_url?: string }).preview_url!
			: video.cover
	);
</script>

<a href="/video/{video.id}" class="card block">
	{#if horizontal}
		<!-- 横向卡片 -->
		<div class="flex gap-3 p-2">
			<div
				class="cover-16-9 w-[140px] flex-shrink-0 rounded-md"
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
			>
				{#if showPreview}
					<!-- 预览图（已加载完成，直接显示） -->
					<img
						src={displayCover}
						alt={video.title}
						referrerpolicy="no-referrer"
						class="rounded-md transition-opacity duration-300 w-full h-full object-cover"
					/>
				{:else}
					<!-- 默认使用 LazyImage -->
					<LazyImage
						src={video.cover}
						alt={video.title}
						width="100%"
						height="100%"
						rounded="rounded-md"
					/>
				{/if}
				{#if isHovering && !previewLoaded && !previewFailed}
					<!-- 预览加载中骨架动画 -->
					<div class="absolute inset-0 rounded-md skeleton-shimmer"></div>
				{/if}
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
		<div
			class="cover-16-9"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
		>
			{#if showPreview}
				<!-- 预览图（已加载完成，直接显示） -->
				<img
					src={displayCover}
					alt={video.title}
					referrerpolicy="no-referrer"
					class="transition-opacity duration-300 w-full h-full object-cover"
				/>
			{:else}
				<!-- 默认使用 LazyImage -->
				<LazyImage
					src={video.cover}
					alt={video.title}
					width="100%"
					height="100%"
				/>
			{/if}
			{#if isHovering && !previewLoaded && !previewFailed}
				<!-- 预览加载中骨架动画 -->
				<div class="absolute inset-0 skeleton-shimmer"></div>
			{/if}
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
