<script lang="ts">
	/**
	 * 选集列表组件
	 * 显示当前视频的所有剧集
	 */
	import type { Episode } from '$lib/types';

	interface Props {
		episodes: Episode[];
		currentEpisodeId?: string;
		onSelect?: (episode: Episode) => void;
	}

	let {
		episodes = [],
		currentEpisodeId = '',
		onSelect
	}: Props = $props();

	// 是否展开全部
	let expanded = $state(false);

	// 显示的剧集数量
	const displayCount = $derived(expanded ? episodes.length : Math.min(episodes.length, 12));
	const displayEpisodes = $derived(episodes.slice(0, displayCount));
	const hasMore = $derived(episodes.length > 12);
</script>

<div class="bg-white dark:bg-dark-card rounded-lg p-3">
	<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text mb-3">
		选集
		<span class="text-xs text-gray-400 font-normal ml-2">共 {episodes.length} 集</span>
	</h3>

	<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
		{#each displayEpisodes as episode}
			<button
				onclick={() => onSelect?.(episode)}
				class="py-2 px-1 text-xs rounded-md text-center transition-all duration-200 btn-press"
				class:bg-bilibili={episode.episode_id === currentEpisodeId}
				class:text-white={episode.episode_id === currentEpisodeId}
				class:bg-gray-100={episode.episode_id !== currentEpisodeId}
				class:dark:bg-dark-border={episode.episode_id !== currentEpisodeId}
				class:text-gray-700={episode.episode_id !== currentEpisodeId}
				class:dark:text-dark-text={episode.episode_id !== currentEpisodeId}
			>
				{episode.episode_name}
			</button>
		{/each}
	</div>

	{#if hasMore}
		<button
			onclick={() => expanded = !expanded}
			class="w-full mt-2 py-2 text-xs text-bilibili text-center btn-press"
		>
			{expanded ? '收起' : `展开全部 ${episodes.length} 集`}
		</button>
	{/if}
</div>
