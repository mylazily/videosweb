<script lang="ts">
	/**
	 * 下拉刷新组件
	 * 支持触摸下拉刷新
	 */

	interface Props {
		onRefresh?: () => Promise<void>;
		loading?: boolean;
	}

	let { onRefresh, loading = false }: Props = $props();

	// 下拉状态
	let startY = $state(0);
	let pullDistance = $state(0);
	let isPulling = $state(false);
	let isRefreshing = $state(false);
	let canRefresh = $derived(pullDistance > 60);

	const THRESHOLD = 60;
	const MAX_PULL = 100;

	function handleTouchStart(e: TouchEvent) {
		if (isRefreshing) return;
		// 只在滚动到顶部时允许下拉
		const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		if (scrollTop <= 0) {
			startY = e.touches[0].clientY;
			isPulling = true;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isPulling || isRefreshing) return;
		const currentY = e.touches[0].clientY;
		const diff = currentY - startY;

		if (diff > 0) {
			// 阻尼效果
			pullDistance = Math.min(diff * 0.5, MAX_PULL);
		}
	}

	function handleTouchEnd() {
		if (!isPulling) return;
		isPulling = false;

		if (canRefresh) {
			isRefreshing = true;
			pullDistance = 40;
			onRefresh?.().finally(() => {
				isRefreshing = false;
				pullDistance = 0;
			});
		} else {
			pullDistance = 0;
		}
	}
</script>

<svelte:window
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
/>

{#if pullDistance > 0 || isRefreshing}
	<div
		class="flex items-center justify-center transition-all duration-300"
		style="height: {pullDistance}px; min-height: {isRefreshing ? '40px' : '0px'};"
	>
		{#if isRefreshing}
			<div class="w-5 h-5 border-2 border-bilibili/30 border-t-bilibili rounded-full animate-spin"></div>
			<span class="ml-2 text-xs text-gray-400">刷新中...</span>
		{:else if canRefresh}
			<span class="text-xs text-bilibili">释放刷新</span>
		{:else}
			<span class="text-xs text-gray-400">下拉刷新</span>
		{/if}
	</div>
{/if}
