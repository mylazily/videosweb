<script lang="ts">
	/**
	 * 播放线路切换组件
	 * 支持多个播放源切换
	 */
	import type { VideoSource } from '$lib/types';

	interface Props {
		sources: VideoSource[];
		currentSourceId?: string;
		onSwitch?: (source: VideoSource) => void;
	}

	let {
		sources = [],
		currentSourceId = '',
		onSwitch
	}: Props = $props();
</script>

{#if sources.length > 1}
	<div class="bg-white dark:bg-dark-card rounded-lg p-3">
		<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text mb-3">
			播放线路
		</h3>

		<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
			{#each sources as source}
				<button
					onclick={() => onSwitch?.(source)}
					class="flex-shrink-0 px-4 py-2 text-xs rounded-full transition-all duration-200 btn-press"
					class:bg-bilibili={source.source_id === currentSourceId}
					class:text-white={source.source_id === currentSourceId}
					class:bg-gray-100={source.source_id !== currentSourceId}
					class:dark:bg-dark-border={source.source_id !== currentSourceId}
					class:text-gray-600={source.source_id !== currentSourceId}
					class:dark:text-dark-text-secondary={source.source_id !== currentSourceId}
				>
					{source.source_name}
					<span class="ml-1 opacity-60">({source.episodes.length}集)</span>
				</button>
			{/each}
		</div>
	</div>
{/if}
