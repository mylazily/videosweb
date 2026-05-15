<script lang="ts">
	/**
	 * 标签云/标签列表页
	 * 热门标签按视频数量排序 + 搜索 + 标签卡片
	 */
	import type { Tag } from '$lib/types';
	import { formatPlayCount } from '$lib/utils';
	import { debounce } from '$lib/utils';

	let { data } = $props();

	let allTags = $state<Tag[]>(data.tags || []);
	let filteredTags = $state<Tag[]>(allTags);
	let searchKeyword = $state('');
	let loading = $state(false);

	// 搜索标签（防抖）
	const handleSearch = debounce((keyword: string) => {
		searchKeyword = keyword;
		if (!keyword.trim()) {
			filteredTags = allTags;
			return;
		}
		const kw = keyword.toLowerCase();
		filteredTags = allTags.filter(
			(tag) => tag.name.toLowerCase().includes(kw) || tag.description?.toLowerCase().includes(kw)
		);
	}, 300);

	// 最大视频数量（用于计算标签大小）
	const maxCount = $derived(Math.max(...allTags.map((t) => t.video_count), 1));

	// 标签云字体大小（12px ~ 24px）
	function getTagSize(count: number): string {
		const ratio = count / maxCount;
		const size = 12 + ratio * 12;
		return `${Math.round(size)}px`;
	}

	// 标签云颜色
	function getTagColor(index: number): string {
		const colors = [
			'#FB7299', '#FF6B6B', '#FFA726', '#66BB6A',
			'#42A5F5', '#AB47BC', '#26C6DA', '#EF5350',
			'#FFCA28', '#8D6E63', '#78909C', '#EC407A'
		];
		return colors[index % colors.length];
	}
</script>

<div class="pb-4 safe-bottom">
	<!-- 搜索栏 -->
	<div class="px-4 pt-3">
		<div class="relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
				<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
			</svg>
			<input
				type="text"
				placeholder="搜索标签..."
				value={searchKeyword}
				oninput={(e) => handleSearch((e.target as HTMLInputElement).value)}
				class="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-dark-border rounded-full outline-none text-gray-900 dark:text-dark-text placeholder-gray-400"
			/>
		</div>
	</div>

	<!-- 标签云区域 -->
	<div class="px-4 mt-4">
		<h2 class="text-base font-bold text-gray-900 dark:text-dark-text mb-3">
			热门标签
		</h2>

		{#if filteredTags.length === 0}
			<div class="flex flex-col items-center py-16 text-gray-400">
				<svg class="w-16 h-16 mb-3 opacity-30" viewBox="0 0 24 24" fill="currentColor">
					<path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
				</svg>
				<p class="text-sm">未找到相关标签</p>
			</div>
		{:else}
			<!-- 标签云 -->
			<div class="flex flex-wrap gap-2.5 mb-6">
				{#each filteredTags as tag, i (tag.slug)}
					<a
						href="/tags/{tag.slug}"
						class="inline-flex items-center px-3 py-1.5 rounded-full transition-all duration-200 btn-press hover:opacity-80"
						style="font-size: {getTagSize(tag.video_count)}; color: {getTagColor(i)}; background: {getTagColor(i)}15;"
					>
						{tag.name}
						<span class="ml-1 text-[10px] opacity-60">{formatPlayCount(tag.video_count)}</span>
					</a>
				{/each}
			</div>

			<!-- 标签卡片列表 -->
			<h2 class="text-base font-bold text-gray-900 dark:text-dark-text mb-3">
				全部标签
			</h2>

			<div class="grid grid-cols-2 gap-3">
				{#each filteredTags as tag (tag.slug)}
					<a href="/tags/{tag.slug}" class="card block p-3">
						<div class="flex items-center gap-3">
							{#if tag.cover}
								<img
									src={tag.cover}
									alt={tag.name}
									class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
									referrerpolicy="no-referrer"
									loading="lazy"
								/>
							{:else}
								<div class="w-12 h-12 rounded-lg bg-bilibili/10 flex items-center justify-center flex-shrink-0">
									<span class="text-bilibili text-lg font-bold">{tag.name[0]}</span>
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
									{tag.name}
								</h3>
								<p class="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
									{tag.description || '暂无描述'}
								</p>
								<span class="text-[10px] text-bilibili mt-0.5">
									{formatPlayCount(tag.video_count)}个视频
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
