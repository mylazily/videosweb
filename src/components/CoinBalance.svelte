<script lang="ts">
	/**
	 * 金币余额显示组件
	 * 显示在导航栏或个人中心
	 * 点击查看金币明细
	 */
	import type { CoinBalance } from '$lib/types';

	interface Props {
		balance?: CoinBalance;
		compact?: boolean;  // 紧凑模式（导航栏用）
		onClick?: () => void;
	}

	let {
		balance,
		compact = false,
		onClick
	}: Props = $props();

	// 默认余额
	const amount = $derived(balance?.amount || 0);
	const frozenAmount = $derived(balance?.frozen_amount || 0);
</script>

{#if compact}
	<!-- 紧凑模式：用于导航栏 -->
	<button
		onclick={onClick}
		class="flex items-center gap-1 px-2 py-1 rounded-full btn-press"
		class:bg-bilibili/10={amount > 0}
	>
		<svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5.5h-2v1.19c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.71 1.38 2.66 2.73 2.98V18.5h2v-1.16c1.52-.33 2.72-1.32 2.72-2.86-.01-2.2-1.79-2.89-3.18-3.34z"/>
		</svg>
		<span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
			{amount}
		</span>
	</button>
{:else}
	<!-- 完整模式：用于个人中心 -->
	<div class="bg-white dark:bg-dark-card rounded-xl p-4">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs text-gray-400 dark:text-dark-text-secondary">金币余额</p>
				<div class="flex items-center gap-1 mt-1">
					<svg class="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5.5h-2v1.19c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.71 1.38 2.66 2.73 2.98V18.5h2v-1.16c1.52-.33 2.72-1.32 2.72-2.86-.01-2.2-1.79-2.89-3.18-3.34z"/>
					</svg>
					<span class="text-2xl font-bold text-gray-900 dark:text-dark-text">
						{amount}
					</span>
				</div>
			</div>

			<button
				onclick={onClick}
				class="px-4 py-2 bg-bilibili text-white text-sm rounded-full btn-press"
			>
				金币明细
			</button>
		</div>

		{#if frozenAmount > 0}
			<div class="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border">
				<span class="text-[10px] text-gray-400">
					冻结金币：{frozenAmount}
				</span>
			</div>
		{/if}
	</div>
{/if}
