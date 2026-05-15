<script lang="ts">
	/**
	 * 加载动画组件
	 */

	interface Props {
		size?: 'small' | 'medium' | 'large';
		text?: string;
	}

	let { size = 'medium', text = '加载中...' }: Props = $props();

	const sizeMap = {
		small: 'w-5 h-5 border-2',
		medium: 'w-8 h-8 border-2',
		large: 'w-12 h-12 border-3'
	};
</script>

<div class="flex flex-col items-center justify-center py-8 gap-3">
	<div class="{sizeMap[size]} border-bilibili/30 border-t-bilibili rounded-full animate-spin"></div>
	{#if text}
		<p class="text-xs text-gray-400">{text}</p>
	{/if}
</div>
