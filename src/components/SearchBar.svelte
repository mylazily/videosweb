<script lang="ts">
	/**
	 * 搜索栏组件
	 */

	interface Props {
		placeholder?: string;
		value?: string;
		onSearch?: (keyword: string) => void;
		onFocus?: () => void;
		autofocus?: boolean;
		showCancel?: boolean;
	}

	let {
		placeholder = '搜索影视、演员...',
		value = $bindable(''),
		onSearch,
		onFocus,
		autofocus = false,
		showCancel = true
	}: Props = $props();

	function handleSubmit() {
		if (value.trim()) {
			onSearch?.(value.trim());
		}
	}

	function handleClear() {
		value = '';
	}
</script>

<div class="flex items-center gap-2 px-4 py-2">
	<div class="flex-1 flex items-center bg-gray-100 dark:bg-dark-border rounded-full px-3 py-2">
		<svg class="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
		<input
			type="text"
			bind:value
			placeholder={placeholder}
			{autofocus}
			onfocus={onFocus}
			onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
			class="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400"
		/>
		{#if value}
			<button onclick={handleClear} class="flex-shrink-0 btn-press">
				<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
				</svg>
			</button>
		{/if}
	</div>

	{#if showCancel}
		<button
			onclick={() => history.back()}
			class="text-sm text-gray-500 dark:text-dark-text-secondary flex-shrink-0 btn-press"
		>
			取消
		</button>
	{/if}
</div>
