<script lang="ts">
	/**
	 * 小红书式瀑布流布局组件
	 * 双列瀑布流，使用 CSS columns 实现
	 * 支持无限滚动加载
	 * 使用 Svelte 5 runes
	 */
	import { onMount } from 'svelte';

	interface Props {
		items: any[];
		gap?: number;         // 列间距（像素）
		columns?: number;     // 列数，默认 2
		columnWidth?: number; // 列宽（像素），默认自适应
		loading?: boolean;    // 是否正在加载
		hasMore?: boolean;    // 是否还有更多数据
		onLoadMore?: () => void; // 加载更多回调
		children: import('svelte').Snippet<[any]>;
	}

	let {
		items,
		gap = 8,
		columns = 2,
		loading = false,
		hasMore = true,
		onLoadMore,
		children
	}: Props = $props();

	// 容器引用
	let containerEl: HTMLElement | null = $state(null);

	// 是否显示加载指示器
	let showLoader = $derived(loading && hasMore);

	/**
	 * 无限滚动检测
	 */
	function handleScroll(): void {
		if (!containerEl || !hasMore || loading) return;

		const { scrollTop, scrollHeight, clientHeight } = containerEl;
		// 距离底部 200px 时触发加载
		if (scrollHeight - scrollTop - clientHeight < 200) {
			onLoadMore?.();
		}
	}

	onMount(() => {
		if (containerEl) {
			containerEl.addEventListener('scroll', handleScroll, { passive: true });
		}

		return () => {
			if (containerEl) {
				containerEl.removeEventListener('scroll', handleScroll);
			}
		};
	});
</script>

<div
	bind:this={containerEl}
	class="waterfall-container"
	style="--columns: {columns}; --gap: {gap}px;"
>
	<div class="waterfall-columns">
		{#each items as item (item.id)}
			{@render children(item)}
		{/each}
	</div>

	<!-- 加载更多指示器 -->
	{#if showLoader}
		<div class="flex justify-center py-4">
			<div class="flex items-center gap-2 text-sm text-gray-400">
				<div class="w-4 h-4 border-2 border-gray-300 border-t-bilibili rounded-full animate-spin"></div>
				<span>加载中...</span>
			</div>
		</div>
	{/if}

	<!-- 没有更多数据 -->
	{#if !hasMore && items.length > 0}
		<div class="text-center py-4 text-xs text-gray-400">
			- 已经到底了 -
		</div>
	{/if}
</div>

<style>
	.waterfall-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}

	.waterfall-columns {
		column-count: var(--columns);
		column-gap: var(--gap);
		padding: 0 var(--gap);
	}

	/* 子元素需要 break-inside: avoid */
	.waterfall-columns :global(*) {
		break-inside: avoid;
		margin-bottom: var(--gap);
	}
</style>
