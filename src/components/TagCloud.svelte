<script lang="ts">
	/**
	 * 标签云组件
	 * 根据视频数量动态调整标签大小
	 * 支持点击跳转到标签页
	 */
	import type { Tag } from '$lib/types';
	import { formatPlayCount } from '$lib/utils';

	interface Props {
		tags: Tag[];
		maxSize?: number; // 最大字体大小（px）
		minSize?: number; // 最小字体大小（px）
	}

	let {
		tags = [],
		maxSize = 22,
		minSize = 12
	}: Props = $props();

	// 最大视频数量
	const maxCount = $derived(Math.max(...tags.map((t) => t.video_count), 1));

	// 标签云颜色列表
	const colors = [
		'#FB7299', '#FF6B6B', '#FFA726', '#66BB6A',
		'#42A5F5', '#AB47BC', '#26C6DA', '#EF5350',
		'#FFCA28', '#8D6E63', '#78909C', '#EC407A'
	];

	/**
	 * 根据视频数量计算标签字体大小
	 */
	function getTagStyle(tag: Tag, index: number): string {
		const ratio = tag.video_count / maxCount;
		const size = minSize + ratio * (maxSize - minSize);
		const color = colors[index % colors.length];
		const opacity = 0.6 + ratio * 0.4;
		return `font-size: ${Math.round(size)}px; color: ${color}; opacity: ${opacity};`;
	}
</script>

{#if tags.length > 0}
	<div class="flex flex-wrap gap-2">
		{#each tags as tag, i (tag.slug)}
			<a
				href="/tags/{tag.slug}"
				class="inline-flex items-center px-2.5 py-1 rounded-full transition-all duration-200 btn-press hover:scale-105"
				style={getTagStyle(tag, i)}
			>
				{tag.name}
			</a>
		{/each}
	</div>
{:else}
	<p class="text-sm text-gray-400">暂无标签</p>
{/if}
