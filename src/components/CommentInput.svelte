<script lang="ts">
	/**
	 * 评论输入框组件
	 */

	interface Props {
		placeholder?: string;
		onSubmit?: (content: string) => void;
		loading?: boolean;
		replyTo?: string;
	}

	let {
		placeholder = '写下你的评论...',
		onSubmit,
		loading = false,
		replyTo = ''
	}: Props = $props();

	let content = $state('');
</script>

<div class="flex items-center gap-2 p-3 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border">
	{#if replyTo}
		<div class="flex-1">
			<span class="text-xs text-bilibili">回复 @{replyTo}</span>
			<div class="flex items-center gap-2 mt-1">
				<input
					type="text"
					bind:value={content}
					placeholder={placeholder}
					class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-dark-border rounded-full outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400"
					onkeydown={(e) => e.key === 'Enter' && content.trim() && onSubmit?.(content.trim())}
				/>
				<button
					onclick={() => { if (content.trim()) { onSubmit?.(content.trim()); content = ''; } }}
					disabled={loading || !content.trim()}
					class="px-4 py-2 text-sm text-white bg-bilibili rounded-full btn-press disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? '发送中...' : '发送'}
				</button>
			</div>
		</div>
	{:else}
		<input
			type="text"
			bind:value={content}
			placeholder={placeholder}
			class="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-dark-border rounded-full outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400"
			onkeydown={(e) => e.key === 'Enter' && content.trim() && onSubmit?.(content.trim())}
		/>
		<button
			onclick={() => { if (content.trim()) { onSubmit?.(content.trim()); content = ''; } }}
			disabled={loading || !content.trim()}
			class="px-4 py-2 text-sm text-white bg-bilibili rounded-full btn-press disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{loading ? '发送中...' : '发送'}
		</button>
	{/if}
</div>
