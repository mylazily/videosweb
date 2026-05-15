<script lang="ts">
	/**
	 * 播放线路切换组件
	 * 支持多个播放源切换
	 * 增强：线路延迟显示、推荐标签、自动切换开关
	 */
	import { onMount } from 'svelte';
	import type { VideoSource, SourceLatency } from '$lib/types';

	interface Props {
		sources: VideoSource[];
		currentSourceId?: string;
		onSwitch?: (source: VideoSource) => void;
		autoSwitch?: boolean;
		onAutoSwitchChange?: (enabled: boolean) => void;
	}

	let {
		sources = [],
		currentSourceId = '',
		onSwitch,
		autoSwitch = false,
		onAutoSwitchChange
	}: Props = $props();

	// 线路延迟数据
	let latencies = $state<Record<string, SourceLatency>>({});
	let testingLatency = $state(false);

	// 推荐线路（延迟最低的）
	const recommendedId = $derived(() => {
		const entries = Object.values(latencies);
		if (entries.length === 0) return '';
		const best = entries.reduce((a, b) => a.latency < b.latency ? a : b);
		return best.source_id;
	});

	/**
	 * 测试线路延迟
	 */
	async function testLatency() {
		testingLatency = true;

		const promises = sources.map(async (source) => {
			const start = Date.now();
			try {
				// 使用一个轻量请求测试延迟
				await fetch(source.episodes[0]?.episode_url || '', {
					method: 'HEAD',
					mode: 'no-cors',
					cache: 'no-cache'
				});
				const latency = Date.now() - start;
				latencies[source.source_id] = {
					source_id: source.source_id,
					latency,
					is_recommended: false
				};
			} catch {
				// 请求失败，标记为高延迟
				latencies[source.source_id] = {
					source_id: source.source_id,
					latency: 9999,
					is_recommended: false
				};
			}
		});

		await Promise.all(promises);

		// 标记推荐线路
		const bestId = recommendedId();
		Object.keys(latencies).forEach((id) => {
			latencies[id] = { ...latencies[id], is_recommended: id === bestId };
		});

		testingLatency = false;
	}

	/**
	 * 格式化延迟显示
	 */
	function formatLatency(ms: number): string {
		if (ms >= 9999) return '超时';
		if (ms < 100) return `${ms}ms`;
		return `${ms}ms`;
	}

	/**
	 * 获取延迟颜色
	 */
	function getLatencyColor(ms: number): string {
		if (ms >= 9999) return 'text-red-500';
		if (ms < 100) return 'text-green-500';
		if (ms < 300) return 'text-yellow-500';
		return 'text-red-500';
	}

	onMount(() => {
		// 自动测试延迟
		testLatency();
	});
</script>

{#if sources.length > 1}
	<div class="bg-white dark:bg-dark-card rounded-lg p-3">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text">
				播放线路
			</h3>
			<div class="flex items-center gap-2">
				<!-- 自动切换开关 -->
				<label class="flex items-center gap-1.5 cursor-pointer">
					<span class="text-[10px] text-gray-400">自动切换</span>
					<div
						class="relative w-8 h-4 rounded-full transition-colors duration-200 cursor-pointer"
						class:bg-bilibili={autoSwitch}
						class:bg-gray-300={!autoSwitch}
						class:dark:bg-dark-border={!autoSwitch}
						onclick={() => onAutoSwitchChange?.(!autoSwitch)}
					>
						<div
							class="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200"
							style="transform: translateX({autoSwitch ? '16px' : '2px'});"
						></div>
					</div>
				</label>

				<!-- 测速按钮 -->
				<button
					onclick={testLatency}
					class="text-[10px] text-bilibili btn-press"
					disabled={testingLatency}
				>
					{testingLatency ? '测速中...' : '测速'}
				</button>
			</div>
		</div>

		<div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
			{#each sources as source}
				{@const latency = latencies[source.source_id]}
				{@const isRecommended = latency?.is_recommended}
				<button
					onclick={() => onSwitch?.(source)}
					class="flex-shrink-0 px-3 py-2 text-xs rounded-lg transition-all duration-200 btn-press relative"
					class:bg-bilibili={source.source_id === currentSourceId}
					class:text-white={source.source_id === currentSourceId}
					class:bg-gray-100={source.source_id !== currentSourceId}
					class:dark:bg-dark-border={source.source_id !== currentSourceId}
					class:text-gray-600={source.source_id !== currentSourceId}
					class:dark:text-dark-text-secondary={source.source_id !== currentSourceId}
				>
					<!-- 推荐标签 -->
					{#if isRecommended && source.source_id !== currentSourceId}
						<span class="absolute -top-1 -right-1 px-1 py-0 text-[8px] text-white bg-green-500 rounded">
							推荐
						</span>
					{/if}

					<div class="flex items-center gap-1.5">
						<span>{source.source_name}</span>
						<span class="opacity-60">({source.episodes.length}集)</span>
					</div>

					<!-- 延迟显示 -->
					{#if latency}
						<span class="block mt-0.5 text-[10px] {source.source_id === currentSourceId ? 'text-white/70' : getLatencyColor(latency.latency)}">
							{formatLatency(latency.latency)}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
