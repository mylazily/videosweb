<script lang="ts">
	/**
	 * 下拉刷新组件 - B站风格
	 * 支持触摸下拉刷新，正确渲染子内容
	 */

	interface Props {
		onRefresh?: () => Promise<void>;
		loading?: boolean;
		children?: import('svelte').Snippet;
	}

	let { onRefresh, loading = false, children }: Props = $props();

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
			<div class="relative w-6 h-6">
				<div class="absolute inset-0 border-2 border-[#FB7299]/20 rounded-full"></div>
				<div class="absolute inset-0 border-2 border-transparent border-t-[#FB7299] rounded-full animate-spin"></div>
			</div>
			<span class="text-xs text-[#FB7299] font-medium">刷新中...</span>
		{:else if canRefresh}
			<div class="w-6 h-6 rounded-full bg-[#FB7299]/10 flex items-center justify-center">
				<svg class="w-4 h-4 text-[#FB7299] rotate-180 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
				</svg>
			</div>
			<span class="text-xs text-[#FB7299] font-medium">释放刷新</span>
		{:else}
			<div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
				<svg class="w-4 h-4 text-gray-400 transition-transform duration-200" style="transform: rotate({pullDistance * 1.5}deg);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
				</svg>
			</div>
			<span class="text-xs text-gray-400">下拉刷新</span>
		{/if}
	</div>
{/if}

{@render children?.()}
