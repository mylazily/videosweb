<script lang="ts">
	/**
	 * 排行榜列表组件
	 */
	import type { RankItem } from '$lib/types';
	import { formatPlayCount } from '$lib/utils';

	interface Props {
		items: RankItem[];
		onItemClick?: (videoId: string) => void;
	}

	let {
		items = [],
		onItemClick
	}: Props = $props();

	// 排名样式
	function getRankStyle(rank: number): string {
		if (rank === 1) return 'bg-red-500 text-white';
		if (rank === 2) return 'bg-orange-500 text-white';
		if (rank === 3) return 'bg-yellow-500 text-white';
		return 'bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-dark-text-secondary';
	}

	// 变化箭头
	function getChangeIcon(change: string): string {
		if (change === 'up') return '&#9650;';
		if (change === 'down') return '&#9660;';
		return '&#8212;';
	}

	function getChangeColor(change: string): string {
		if (change === 'up') return 'text-red-500';
		if (change === 'down') return 'text-green-500';
		return 'text-gray-400';
	}
</script>

<div class="space-y-2">
	{#each items as item (item.video.id)}
		<button
			onclick={() => onItemClick?.(item.video.id)}
			class="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-dark-card btn-press w-full text-left"
		>
			<!-- 排名 -->
			<span class="w-6 h-6 flex items-center justify-center text-xs font-bold rounded {getRankStyle(item.rank)}">
				{item.rank}
			</span>

			<!-- 封面 -->
			<div class="cover-16-9 w-[80px] flex-shrink-0 rounded">
				<img
					src={item.video.cover}
					alt={item.video.title}
					loading="lazy"
					referrerpolicy="no-referrer"
					class="rounded"
				/>
			</div>

			<!-- 信息 -->
			<div class="flex-1 min-w-0">
				<h4 class="text-sm font-medium line-clamp-1 text-gray-900 dark:text-dark-text">
					{item.video.title}
				</h4>
				<div class="flex items-center gap-2 mt-1">
					<span class="text-xs text-orange-500">{item.video.rating.toFixed(1)}分</span>
					<span class="text-[10px] text-gray-400">{formatPlayCount(item.video.play_count)}播放</span>
				</div>
				<span class="text-[10px] text-gray-400">{item.video.category} / {item.video.year}</span>
			</div>

			<!-- 变化 -->
			<span class="text-xs {getChangeColor(item.change)}">
				{@html getChangeIcon(item.change)}
			</span>
		</button>
	{/each}
</div>
