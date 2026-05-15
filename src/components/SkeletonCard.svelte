<script lang="ts">
	/**
	 * 骨架屏卡片组件
	 * 用于加载占位
	 */

	interface Props {
		horizontal?: boolean;
		count?: number;
	}

	let { horizontal = false, count = 1 }: Props = $props();
</script>

{#each Array(count) as _}
	<div class="card animate-pulse">
		{#if horizontal}
			<div class="flex gap-3 p-2">
				<div class="w-[140px] h-[80px] rounded-md skeleton-shimmer flex-shrink-0"></div>
				<div class="flex-1 space-y-2 py-1">
					<div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
					<div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
					<div class="h-3 w-1/3 rounded skeleton-shimmer"></div>
				</div>
			</div>
		{:else}
			<div class="w-full h-0 pt-[56.25%] skeleton-shimmer rounded-t-lg"></div>
			<div class="p-2 space-y-2">
				<div class="h-3 w-3/4 rounded skeleton-shimmer"></div>
				<div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
			</div>
		{/if}
	</div>
{/each}
