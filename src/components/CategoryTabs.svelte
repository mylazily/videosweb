<script lang="ts">
	/**
	 * 分类标签栏组件
	 * 横向滚动标签
	 */
	import type { Category } from '$lib/types';
	import { CATEGORIES } from '$lib/constants';

	interface Props {
		categories?: Category[];
		activeSlug?: string;
		onSelect?: (slug: string) => void;
	}

	let {
		categories = CATEGORIES.map((c) => ({ ...c, count: 0 })),
		activeSlug = '',
		onSelect
	}: Props = $props();
</script>

<div class="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2">
	{#each categories as category}
		<button
			onclick={() => onSelect?.(category.slug)}
			class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 btn-press"
			class:bg-bilibili={category.slug === activeSlug}
			class:text-white={category.slug === activeSlug}
			class:bg-gray-100={category.slug !== activeSlug}
			class:dark:bg-dark-border={category.slug !== activeSlug}
			class:text-gray-600={category.slug !== activeSlug}
			class:dark:text-dark-text-secondary={category.slug !== activeSlug}
		>
			{#if category.icon}
				<span class="mr-1">{category.icon}</span>
			{/if}
			{category.name}
		</button>
	{/each}
</div>
