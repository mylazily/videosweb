<script lang="ts">
	import type { Video } from '$lib/types';
	import { formatPlayCount } from '$lib/utils';

	interface Props {
		video: Video;
		index?: number;
	}

	let { video, index = 0 }: Props = $props();
</script>

<a href="/v/{video.id}" class="block bg-white rounded-lg overflow-hidden">
	<!-- 封面 -->
	<div class="relative w-full" style="aspect-ratio: 3/4;">
		{#if video.cover}
			<img
				src={video.cover}
				alt={video.title}
				loading="lazy"
				referrerpolicy="no-referrer"
				class="w-full h-full object-cover bg-gray-100"
			/>
		{:else}
			<div class="w-full h-full bg-gray-200 flex items-center justify-center">
				<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
			</div>
		{/if}

		<!-- 底部渐变信息条 -->
		<div class="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
			{#if video.play_count > 0}
				<span class="text-[10px] text-white/90 flex items-center gap-0.5">
					<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
					{formatPlayCount(video.play_count)}
				</span>
			{:else}
				<span></span>
			{/if}
			{#if video.rating > 0}
				<span class="text-[10px] text-white/90 flex items-center gap-0.5">
					<svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
					{video.rating.toFixed(1)}
				</span>
			{/if}
		</div>

		<!-- 分类标签 -->
		{#if video.category}
			<div class="absolute top-1.5 left-1.5">
				<span class="px-1.5 py-0.5 text-[10px] text-white bg-[#FB7299]/90 rounded">{video.category}</span>
			</div>
		{/if}
	</div>

	<!-- 标题 -->
	<div class="px-2 pt-1.5 pb-2">
		<h3 class="text-[13px] leading-[1.3] text-gray-800 font-medium line-clamp-2 min-h-[2.6em]">
			{video.title}
		</h3>
		<div class="flex items-center justify-between mt-1">
			<span class="text-[11px] text-gray-400 truncate max-w-[60%]">
				{video.year || '影视'}
			</span>
			{#if video.update_time}
				<span class="text-[10px] text-gray-300">{video.update_time}</span>
			{/if}
		</div>
	</div>
</a>
