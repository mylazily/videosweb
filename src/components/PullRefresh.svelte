<script lang="ts">
	/**
	 * 下拉刷新组件 - 商业级优化版
	 * 支持触摸下拉刷新，带动画效果
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
	const MAX_PULL = 120;

	function handleTouchStart(e: TouchEvent) {
		if (isRefreshing || loading) return;
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
			// 阻尼效果 - 越拉越难拉
			pullDistance = Math.min(diff * 0.4, MAX_PULL);
		}
	}

	function handleTouchEnd() {
		if (!isPulling) return;
		isPulling = false;

		if (canRefresh && onRefresh) {
			isRefreshing = true;
			pullDistance = 50;
			onRefresh?.().finally(() => {
				setTimeout(() => {
					isRefreshing = false;
					pullDistance = 0;
				}, 200);
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
		class="flex items-center justify-center gap-2 transition-all duration-300 ease-out"
		style="height: {Math.min(pullDistance, 60)}px; opacity: {Math.min(pullDistance / 40, 1)};"
	>
		{#if isRefreshing}
			<!-- 刷新中动画 -->
			<div class="relative w-6 h-6">
				<div class="absolute inset-0 border-2 border-bilibili/20 rounded-full"></div>
				<div class="absolute inset-0 border-2 border-transparent border-t-bilibili rounded-full animate-spin"></div>
			</div>
			<span class="text-xs text-bilibili font-medium">刷新中...</span>
		{:else if canRefresh}
			<!-- 释放刷新 -->
			<div class="w-6 h-6 rounded-full bg-bilibili/10 flex items-center justify-center">
				<svg class="w-4 h-4 text-bilibili rotate-180 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
				</svg>
			</div>
			<span class="text-xs text-bilibili font-medium">释放刷新</span>
		{:else}
			<!-- 下拉刷新 -->
			<div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
				<svg class="w-4 h-4 text-gray-400 transition-transform duration-200" style="transform: rotate({pullDistance * 1.5}deg);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
				</svg>
			</div>
			<span class="text-xs text-gray-400">下拉刷新</span>
		{/if}
	</div>
{/if}
