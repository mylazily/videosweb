<script lang="ts">
	/**
	 * 排行榜页
	 */
	import type { RankItem } from '$lib/types';
	import RankList from '$components/RankList.svelte';

	let { data } = $props();

	let rankItems = $state<RankItem[]>(data.rankItems || []);

	function handleItemClick(videoId: string) {
		window.location.href = `/video/${videoId}`;
	}
</script>

<div class="px-4 py-3 safe-bottom">
	<div class="flex items-center gap-2 mb-4">
		<span class="text-xl">&#127942;</span>
		<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
			热门排行榜
		</h2>
	</div>

	<RankList items={rankItems} onItemClick={handleItemClick} />
</div>
