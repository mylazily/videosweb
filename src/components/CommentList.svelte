<script lang="ts">
	/**
	 * 评论列表组件
	 * 支持嵌套回复
	 */
	import type { Comment } from '$lib/types';
	import { formatDate } from '$lib/utils';

	interface Props {
		comments: Comment[];
		onLike?: (commentId: string) => void;
		onReply?: (comment: Comment) => void;
		loading?: boolean;
	}

	let {
		comments = [],
		onLike,
		onReply,
		loading = false
	}: Props = $props();

	// 展开的回复评论
	let expandedReplies = $state<Set<string>>(new Set());

	// 切换回复展开
	function toggleReplies(commentId: string) {
		const newSet = new Set(expandedReplies);
		if (newSet.has(commentId)) {
			newSet.delete(commentId);
		} else {
			newSet.add(commentId);
		}
		expandedReplies = newSet;
	}
</script>

<div class="space-y-3">
	{#if loading}
		<!-- 加载中 -->
		{#each Array(3) as _}
			<div class="flex gap-3 animate-pulse">
				<div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-border flex-shrink-0"></div>
				<div class="flex-1 space-y-2">
					<div class="h-3 w-20 bg-gray-200 dark:bg-dark-border rounded"></div>
					<div class="h-3 w-full bg-gray-200 dark:bg-dark-border rounded"></div>
					<div class="h-3 w-2/3 bg-gray-200 dark:bg-dark-border rounded"></div>
				</div>
			</div>
		{/each}
	{:else if comments.length === 0}
		<div class="flex flex-col items-center py-8 text-gray-400">
			<svg class="w-12 h-12 mb-2 opacity-30" viewBox="0 0 24 24" fill="currentColor">
				<path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
			</svg>
			<p class="text-sm">暂无评论，快来抢沙发吧</p>
		</div>
	{:else}
		{#each comments as comment (comment.id)}
			<div class="flex gap-3 py-3 border-b border-gray-100 dark:border-dark-border last:border-0">
				<!-- 头像 -->
				<img
					src={comment.avatar || '/icons/icon-192.png'}
					alt={comment.username}
					class="w-8 h-8 rounded-full flex-shrink-0 object-cover"
					referrerpolicy="no-referrer"
				/>

				<div class="flex-1 min-w-0">
					<!-- 用户名和时间 -->
					<div class="flex items-center justify-between mb-1">
						<span class="text-xs text-gray-500 dark:text-dark-text-secondary">{comment.username}</span>
						<span class="text-[10px] text-gray-400">{formatDate(comment.create_time)}</span>
					</div>

					<!-- 评论内容 -->
					<p class="text-sm text-gray-800 dark:text-dark-text leading-relaxed mb-2">
						{comment.content}
					</p>

					<!-- 操作栏 -->
					<div class="flex items-center gap-4">
						<button
							onclick={() => onLike?.(comment.id)}
							class="flex items-center gap-1 text-xs btn-press"
							class:text-bilibili={comment.is_liked}
							class:text-gray-400={!comment.is_liked}
						>
							<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill={comment.is_liked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
								<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
							</svg>
							{comment.like_count > 0 ? comment.like_count : '赞'}
						</button>

						<button
							onclick={() => onReply?.(comment)}
							class="text-xs text-gray-400 btn-press"
						>
							回复
						</button>
					</div>

					<!-- 嵌套回复 -->
					{#if comment.replies && comment.replies.length > 0}
						<div class="mt-2 bg-gray-50 dark:bg-dark-bg rounded-lg p-2">
							{#each (expandedReplies.has(comment.id) ? comment.replies : comment.replies.slice(0, 2)) as reply}
								<div class="flex gap-2 py-1.5">
									<img
										src={reply.avatar || '/icons/icon-192.png'}
										alt={reply.username}
										class="w-5 h-5 rounded-full flex-shrink-0 object-cover"
										referrerpolicy="no-referrer"
									/>
									<div class="flex-1 min-w-0">
										<span class="text-xs text-bilibili">{reply.username}</span>
										<span class="text-xs text-gray-700 dark:text-dark-text ml-1">{reply.content}</span>
									</div>
								</div>
							{/each}

							{#if comment.replies.length > 2}
								<button
									onclick={() => toggleReplies(comment.id)}
									class="text-xs text-bilibili mt-1 btn-press"
								>
									{expandedReplies.has(comment.id)
										? '收起回复'
										: `查看全部 ${comment.replies.length} 条回复`}
								</button>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
