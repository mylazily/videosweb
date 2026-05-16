<script lang="ts">
	/**
	 * 顶部标题栏组件 - 商业级优化版
	 * 包含标题、搜索入口、动态背景
	 */
	import { baseUrlStore } from '$lib/stores/apiConfigStore';

	interface Props {
		title?: string;
		showBack?: boolean;
		showSearch?: boolean;
		transparent?: boolean;
		showLogo?: boolean;
	}

	let { 
		title = 'XVideos 影视', 
		showBack = false, 
		showSearch = true, 
		transparent = false,
		showLogo = true 
	}: Props = $props();

	// 监听API状态
	let apiStatus = $state<'online' | 'offline' | 'checking'>('checking');
	
	baseUrlStore.subscribe(url => {
		apiStatus = url ? 'online' : 'offline';
	});
</script>

<header
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md {transparent ? 'bg-transparent' : 'bg-white/90 dark:bg-dark-card/90'}"
	style="padding-top: env(safe-area-inset-top, 0px);"
>
	<div class="flex items-center h-[50px] px-4">
		<!-- 返回按钮 -->
		{#if showBack}
			<button
				onclick={() => history.back()}
				class="flex items-center justify-center w-9 h-9 -ml-1 mr-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}

		<!-- Logo和标题 -->
		<div class="flex items-center flex-1 min-w-0">
			{#if showLogo}
				<div class="relative mr-2">
					<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FB7299] to-[#FC9B7A] flex items-center justify-center shadow-lg">
						<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
							<path d="M8 5v14l11-7z"/>
						</svg>
					</div>
					<!-- 在线状态指示器 -->
					<div 
						class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-card"
						class:bg-green-500={apiStatus === 'online'}
						class:bg-red-500={apiStatus === 'offline'}
						class:bg-yellow-500={apiStatus === 'checking'}
					></div>
				</div>
			{/if}
			<h1 
				class="text-lg font-bold truncate tracking-tight"
				class:text-white={transparent}
				class:text-gray-900={!transparent}
				class:dark:text-dark-text={!transparent}
			>
				{title}
			</h1>
		</div>

		<!-- 搜索入口 -->
		{#if showSearch}
			<div class="flex items-center gap-2">
				<!-- 搜索按钮 -->
				<a
					href="/search"
					class="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
					aria-label="搜索"
				>
					<svg 
						class="w-5 h-5 transition-colors" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2"
						class:text-white={transparent}
						class:text-gray-700={!transparent}
						class:dark:text-dark-text={!transparent}
					>
						<circle cx="11" cy="11" r="8" />
						<path d="M21 21l-4.35-4.35" />
					</svg>
				</a>
			</div>
		{/if}
	</div>
</header>

<!-- 占位高度 -->
<div class="h-[50px]" style="margin-top: env(safe-area-inset-top, 0px);"></div>
