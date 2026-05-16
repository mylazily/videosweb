<script lang="ts">
	/**
	 * 骨架屏卡片组件 - 商业级优化版
	 * 使用 shimmer 动画效果
	 */

	interface Props {
		horizontal?: boolean;
		count?: number;
	}

	let { horizontal = false, count = 1 }: Props = $props();
</script>

{#each Array(count) as _, i}
	<div 
		class="relative overflow-hidden rounded-xl bg-white dark:bg-dark-card shadow-sm"
		style="animation-delay: {i * 80}ms;"
	>
		<!-- Shimmer 效果层 -->
		<div class="absolute inset-0 shimmer-overlay z-10"></div>
		
		{#if horizontal}
			<div class="flex gap-3 p-2">
				<div class="w-[140px] h-[80px] rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
				<div class="flex-1 space-y-2.5 py-1">
					<div class="h-3.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700"></div>
					<div class="h-3 w-3/5 rounded bg-gray-200 dark:bg-gray-700"></div>
					<div class="flex gap-2 mt-2">
						<div class="h-4 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
						<div class="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
					</div>
				</div>
			</div>
		{:else}
			<!-- 封面骨架 -->
			<div class="w-full aspect-video bg-gray-200 dark:bg-gray-700"></div>
			<!-- 内容骨架 -->
			<div class="p-3 space-y-2.5">
				<div class="h-3.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700"></div>
				<div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
				<div class="flex items-center justify-between mt-2 pt-2">
					<div class="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
					<div class="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
				</div>
			</div>
		{/if}
	</div>
{/each}

<style>
	.shimmer-overlay {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	
	:global(.dark) .shimmer-overlay {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 100%
		);
		background-size: 200% 100%;
	}
	
	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
