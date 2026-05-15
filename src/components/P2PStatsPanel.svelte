<script lang="ts">
	/**
	 * P2P 统计悬浮面板组件
	 * 显示 P2P 下载速度、HTTP 下载速度、节点数、分享率等信息
	 * 可折叠，不遮挡播放
	 * B站粉色主题 #FB7299
	 * Svelte 5 runes
	 */
	import type { P2PStats } from '$lib/types';

	interface Props {
		stats: P2PStats;
	}

	let { stats }: Props = $props();

	// 面板折叠状态
	let isExpanded = $state(false);

	// ========== 工具函数 ==========

	/** 格式化字节为 KB/s */
	function formatSpeed(bytesPerSecond: number): string {
		if (bytesPerSecond <= 0) return '0';
		return (bytesPerSecond / 1024).toFixed(1);
	}

	/** 格式化字节为可读大小 */
	function formatBytes(bytes: number): string {
		if (bytes <= 0) return '0 B';
		if (bytes < 1024) return `${bytes.toFixed(0)} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	/** 计算分享率 */
	function getShareRatio(): string {
		const totalDownload = stats.p2pDownloaded + stats.httpDownloaded;
		if (totalDownload <= 0) return '0.00';
		const ratio = stats.p2pDownloaded / totalDownload;
		return ratio.toFixed(2);
	}

	// ========== 派生状态 ==========

	const totalSpeed = $derived(stats.p2pSpeed + stats.httpSpeed);
	const totalDownloaded = $derived(stats.p2pDownloaded + stats.httpDownloaded);
</script>

<!-- P2P 统计悬浮面板 -->
<div class="absolute top-2 right-2 z-30">
	{#if isExpanded}
		<!-- 展开状态 -->
		<div
			class="rounded-lg shadow-lg backdrop-blur-sm text-white text-xs overflow-hidden transition-all duration-200"
			style="background-color: rgba(251, 114, 153, 0.92); min-width: 160px;"
		>
			<!-- 标题栏 -->
			<button
				onclick={() => { isExpanded = false; }}
				class="w-full flex items-center justify-between px-3 py-1.5 font-medium"
				aria-label="折叠统计面板"
			>
				<span class="flex items-center gap-1">
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
					</svg>
					P2P 网络
				</span>
				<svg class="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
					<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
				</svg>
			</button>

			<!-- 统计内容 -->
			<div class="px-3 py-2 space-y-1.5" style="background-color: rgba(0, 0, 0, 0.2);">
				<!-- P2P 下载速度 -->
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1 opacity-90">
						<span class="text-sm">&#x1F680;</span>
						P2P 速度
					</span>
					<span class="font-mono font-medium">
						{formatSpeed(stats.p2pSpeed)} KB/s
					</span>
				</div>

				<!-- HTTP 下载速度 -->
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1 opacity-90">
						<span class="text-sm">&#x1F310;</span>
						HTTP 速度
					</span>
					<span class="font-mono font-medium">
						{formatSpeed(stats.httpSpeed)} KB/s
					</span>
				</div>

				<!-- 节点数 -->
				<div class="flex items-center justify-between">
					<span class="flex items-center gap-1 opacity-90">
						<span class="text-sm">&#x1F465;</span>
						节点数
					</span>
					<span class="font-mono font-medium">
						{stats.p2pPeers}
					</span>
				</div>

				<!-- 分隔线 -->
				<div class="border-t border-white/20 my-1"></div>

				<!-- 总下载量 -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">总下载</span>
					<span class="font-mono">{formatBytes(totalDownloaded)}</span>
				</div>

				<!-- P2P 分享率 -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">P2P 占比</span>
					<span class="font-mono">{getShareRatio()}</span>
				</div>

				<!-- 缓冲区 -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">缓冲</span>
					<span class="font-mono">{stats.bufferLength.toFixed(1)}s</span>
				</div>

				<!-- P2P 状态 -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">状态</span>
					{#if stats.isP2PAvailable}
						<span class="flex items-center gap-1">
							<span class="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
							P2P
						</span>
					{:else}
						<span class="opacity-60">HTTP 降级</span>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- 折叠状态 —— 小按钮 -->
		<button
			onclick={() => { isExpanded = true; }}
			class="flex items-center gap-1 px-2 py-1 rounded-md text-white text-[10px] shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
			style="background-color: rgba(251, 114, 153, 0.85);"
			aria-label="展开 P2P 统计面板"
		>
			<span class="text-sm">&#x1F680;</span>
			<span class="font-mono">{formatSpeed(totalSpeed)}</span>
			<span class="opacity-70">KB/s</span>
			{#if stats.p2pPeers > 0}
				<span class="opacity-60">|</span>
				<span class="opacity-70">{stats.p2pPeers}</span>
			{/if}
		</button>
	{/if}
</div>
