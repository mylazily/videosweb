<script lang="ts">
	/**
	 * 加载动画组件 - 商业级优化版
	 * 支持多种样式和动画效果
	 */

	interface Props {
		size?: 'small' | 'medium' | 'large';
		text?: string;
		variant?: 'spinner' | 'dots' | 'pulse';
	}

	let { size = 'medium', text, variant = 'spinner' }: Props = $props();

	const sizeMap = {
		small: { spinner: 'w-5 h-5', dot: 'w-1.5 h-1.5', text: 'text-[10px]' },
		medium: { spinner: 'w-8 h-8', dot: 'w-2 h-2', text: 'text-xs' },
		large: { spinner: 'w-12 h-12', dot: 'w-3 h-3', text: 'text-sm' }
	};
</script>

<div class="flex flex-col items-center justify-center py-6 gap-3">
	{#if variant === 'spinner'}
		<!-- 经典旋转动画 -->
		<div class="relative {sizeMap[size].spinner}">
			<div class="absolute inset-0 border-2 border-bilibili/20 rounded-full"></div>
			<div class="absolute inset-0 border-2 border-transparent border-t-bilibili rounded-full animate-spin"></div>
		</div>
	{:else if variant === 'dots'}
		<!-- 三点跳动动画 -->
		<div class="flex items-center gap-1.5">
			{#each [0, 1, 2] as i}
				<div 
					class="{sizeMap[size].dot} bg-bilibili rounded-full animate-bounce"
					style="animation-delay: {i * 150}ms;"
				></div>
			{/each}
		</div>
	{:else if variant === 'pulse'}
		<!-- 脉冲动画 -->
		<div class="{sizeMap[size].spinner} relative">
			<div class="absolute inset-0 bg-bilibili/30 rounded-full animate-ping"></div>
			<div class="absolute inset-2 bg-bilibili/50 rounded-full animate-pulse"></div>
		</div>
	{/if}
	
	{#if text}
		<p class="{sizeMap[size].text} text-gray-400 dark:text-gray-500 font-medium">{text}</p>
	{/if}
</div>
