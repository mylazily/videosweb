<script lang="ts">
	/**
	 * 观看历史页
	 */
	import type { WatchHistory } from '$lib/types';
	import { formatDuration, formatDate } from '$lib/utils';

	let { data } = $props();

	let history = $state<WatchHistory[]>(data.history || []);
	let loading = $state(false);

	// 删除单条记录
	async function handleDelete(id: string) {
		history = history.filter((h) => h.id !== id);
	}

	// 清空全部
	async function handleClearAll() {
		if (confirm('确定要清空所有观看记录吗？')) {
			loading = true;
			await new Promise((resolve) => setTimeout(resolve, 500));
			history = [];
			loading = false;
		}
	}

	// 进度百分比
	function getProgressPercent(progress: number, duration: number): number {
		if (duration <= 0) return 0;
		return Math.min((progress / duration) * 100, 100);
	}
</script>

<div class="px-4 py-3 safe-bottom">
	<!-- 标题栏 -->
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-base font-bold text-gray-900 dark:text-dark-text">
			观看历史
		</h2>
		{#if history.length > 0}
			<button
				onclick={handleClearAll}
				class="text-xs text-gray-400 btn-press"
			>
				清空
			</button>
		{/if}
	</div>

	{#if history.length === 0}
		<!-- 空状态 -->
		<div class="flex flex-col items-center py-20 text-gray-400">
			<svg class="w-16 h-16 mb-3 opacity-30" viewBox="0 0 24 24" fill="currentColor">
				<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
			</svg>
			<p class="text-sm">暂无观看记录</p>
			<a href="/" class="mt-3 text-xs text-bilibili">去看看有什么好片子</a>
		</div>
	{:else}
		<!-- 历史列表 -->
		<div class="space-y-3">
			{#each history as item (item.id)}
				<a href="/video/{item.video_id}" class="flex gap-3 p-2 rounded-lg bg-white dark:bg-dark-card card">
					<!-- 封面 -->
					<div class="cover-16-9 w-[130px] flex-shrink-0 rounded">
						<img
							src={item.video_cover}
							alt={item.video_title}
							loading="lazy"
							referrerpolicy="no-referrer"
							class="rounded"
						/>
						<!-- 进度条 -->
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
							<div
								class="h-full bg-bilibili"
								style="width: {getProgressPercent(item.progress, item.duration)}%"
							></div>
						</div>
						<!-- 时长 -->
						<span class="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] text-white bg-black/60 rounded">
							{formatDuration(item.progress)} / {formatDuration(item.duration)}
						</span>
					</div>

					<!-- 信息 -->
					<div class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
						<div>
							<h3 class="text-sm font-medium line-clamp-2 text-gray-900 dark:text-dark-text">
								{item.video_title}
							</h3>
							<p class="text-xs text-gray-400 mt-1">{item.episode_name}</p>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px] text-gray-400">{formatDate(item.watch_time)}</span>
							<button
								onclick|stopPropagation={() => handleDelete(item.id)}
								class="text-xs text-gray-400 btn-press"
							>
								删除
							</button>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
