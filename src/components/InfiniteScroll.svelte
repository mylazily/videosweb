<script lang="ts">
	/**
	 * 无限滚动加载组件
	 * 滚动到底部自动加载更多
	 */
	import { onMount } from 'svelte';

	interface Props {
		hasMore?: boolean;
		loading?: boolean;
		threshold?: number;
		onLoadMore?: () => void;
	}

	let {
		hasMore = true,
		loading = false,
		threshold = 200,
		onLoadMore
	}: Props = $props();

	let sentinel: HTMLElement;

	onMount(() => {
		// 使用 IntersectionObserver 监听底部元素
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					onLoadMore?.();
				}
			},
			{ rootMargin: `${threshold}px` }
		);

		if (sentinel) {
			observer.observe(sentinel);
		}

		return () => observer.disconnect();
	});
</script>

<!-- 哨兵元素 -->
{#if hasMore}
	<div bind:this={sentinel} class="flex items-center justify-center py-4">
		{#if loading}
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 border-2 border-bilibili/30 border-t-bilibili rounded-full animate-spin"></div>
				<span class="text-xs text-gray-400">加载更多...</span>
			</div>
		{:else}
			<span class="text-xs text-gray-400">上拉加载更多</span>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center py-4">
		<span class="text-xs text-gray-400">-- 已经到底了 --</span>
	</div>
{/if}
