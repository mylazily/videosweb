<script lang="ts">
	/**
	 * 顶部标题栏组件
	 * 包含标题和搜索入口
	 */

	interface Props {
		title?: string;
		showBack?: boolean;
		showSearch?: boolean;
		transparent?: boolean;
	}

	let { title = 'XVideos 影视', showBack = false, showSearch = true, transparent = false }: Props = $props();
</script>

<header
	class="fixed top-0 left-0 right-0 z-50 flex items-center h-[50px] px-4 transition-all duration-300"
	class:bg-white={!transparent}
	class:dark:bg-dark-card={!transparent}
	class:bg-transparent={transparent}
	style="padding-top: env(safe-area-inset-top, 0px);"
>
	<!-- 返回按钮 -->
	{#if showBack}
		<button
			onclick={() => history.back()}
			class="flex items-center justify-center w-8 h-8 -ml-2 mr-2 rounded-full btn-press"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 19l-7-7 7-7" />
			</svg>
		</button>
	{/if}

	<!-- 标题 -->
	<h1 class="flex-1 text-base font-bold truncate"
	    class:text-white={transparent}
	    class:text-gray-900={!transparent}
	    class:dark:text-dark-text={!transparent}
	>
		{title}
	</h1>

	<!-- 搜索入口 -->
	{#if showSearch}
		<a
			href="/search"
			class="flex items-center justify-center w-8 h-8 rounded-full btn-press"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
			     class:text-white={transparent}
			     class:text-gray-600={!transparent}
			     class:dark:text-dark-text={!transparent}
			>
				<circle cx="11" cy="11" r="8" />
				<path d="M21 21l-4.35-4.35" />
			</svg>
		</a>
	{/if}
</header>

<!-- 占位高度 -->
<div class="h-[50px]" style="margin-top: env(safe-area-inset-top, 0px);"></div>
