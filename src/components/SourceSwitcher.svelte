<script lang="ts">
	/**
	 * 播放线路切换组件（重写版）
	 * 功能：
	 * - 横向滚动的线路标签列表
	 * - 每个标签显示：线路名称 + 延迟 + 质量/语言标签
	 * - 当前线路高亮（粉色主题 #FB7299）
	 * - 延迟最低的线路显示 "推荐" 标签
	 * - 点击切换线路
	 * - 延迟测速按钮（ping 各线路的 m3u8 URL）
	 * - Svelte 5 runes
	 */
	import { onMount } from 'svelte';
	import type { PlayLine } from '$lib/types';

	interface Props {
		playLines: PlayLine[];
		currentIndex: number;
		onSwitch: (index: number) => void;
		latencies?: Map<number, number>;
	}

	let {
		playLines = [],
		currentIndex = 0,
		onSwitch,
		latencies = new Map()
	}: Props = $props();

	// 内部延迟数据（测速结果）
	let internalLatencies = $state<Map<number, number>>(new Map());
	let testingLatency = $state(false);

	// 合并外部传入的延迟和内部测速的延迟
	const mergedLatencies = $derived.by(() => {
		const result = new Map<number, number>();
		// 优先使用内部测速结果
		internalLatencies.forEach((val, key) => result.set(key, val));
		// 补充外部传入的延迟
		latencies.forEach((val, key) => {
			if (!result.has(key)) result.set(key, val);
		});
		return result;
	});

	// 推荐线路索引（延迟最低的）
	const recommendedIndex = $derived.by(() => {
		const lats = mergedLatencies;
		if (lats.size === 0) return -1;

		let bestIndex = -1;
		let bestLatency = Infinity;

		lats.forEach((latency, index) => {
			if (latency < bestLatency && latency < 9999) {
				bestLatency = latency;
				bestIndex = index;
			}
		});

		return bestIndex;
	});

	/**
	 * 测试线路延迟
	 * ping 各线路的 m3u8 URL
	 */
	async function testLatency(): Promise<void> {
		testingLatency = true;
		const results = new Map<number, number>();

		const promises = playLines.map(async (line, index) => {
			const url = line.m3u8_url;
			if (!url) {
				results.set(index, 9999);
				return;
			}

			const start = Date.now();
			try {
				await fetch(url, {
					method: 'HEAD',
					mode: 'no-cors',
					cache: 'no-cache'
				});
				results.set(index, Date.now() - start);
			} catch {
				results.set(index, 9999);
			}
		});

		await Promise.all(promises);
		internalLatencies = results;
		testingLatency = false;
	}

	/**
	 * 格式化延迟显示
	 */
	function formatLatency(ms: number): string {
		if (ms >= 9999) return '超时';
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}

	/**
	 * 获取延迟颜色类名
	 */
	function getLatencyColorClass(ms: number): string {
		if (ms >= 9999) return 'text-red-500';
		if (ms < 200) return 'text-green-500';
		if (ms < 500) return 'text-yellow-500';
		return 'text-red-500';
	}

	onMount(() => {
		// 自动测速
		if (playLines.length > 1) {
			testLatency();
		}
	});
</script>

{#if playLines.length > 1}
	<div class="bg-white dark:bg-dark-card rounded-lg p-3">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text">
				播放线路
			</h3>

			<!-- 测速按钮 -->
			<button
				onclick={testLatency}
				class="text-[10px] btn-press disabled:opacity-50"
				style="color: #FB7299;"
				disabled={testingLatency}
			>
				{testingLatency ? '测速中...' : '测速'}
			</button>
		</div>

		<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
			{#each playLines as line, index}
				{@const latency = mergedLatencies.get(index)}
				{@const isRecommended = recommendedIndex === index && index !== currentIndex}
				{@const isCurrent = index === currentIndex}

				<button
					onclick={() => onSwitch(index)}
					class="flex-shrink-0 px-3 py-2 text-xs rounded-lg transition-all duration-200 btn-press relative"
					style={isCurrent
						? 'background-color: #FB7299; color: white;'
						: 'background-color: #f3f4f6; color: #4b5563;'}
				>
					<!-- 推荐标签 -->
					{#if isRecommended}
						<span class="absolute -top-1 -right-1 px-1 py-0 text-[8px] text-white bg-green-500 rounded">
							推荐
						</span>
					{/if}

					<!-- 线路名称 -->
					<div class="flex items-center gap-1.5">
						<span class="font-medium">{line.source_name}</span>
					</div>

					<!-- 质量/语言标签 -->
					<div class="flex items-center gap-1 mt-0.5">
						{#if line.quality}
							<span class="text-[10px] {isCurrent ? 'text-white/70' : 'text-gray-400'}">
								{line.quality}
							</span>
						{/if}
						{#if line.language}
							<span class="text-[10px] {isCurrent ? 'text-white/70' : 'text-gray-400'}">
								{line.language}
							</span>
						{/if}
					</div>

					<!-- 延迟显示 -->
					{#if latency !== undefined}
						<span class="block mt-0.5 text-[10px] {isCurrent ? 'text-white/70' : getLatencyColorClass(latency)}">
							{formatLatency(latency)}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
