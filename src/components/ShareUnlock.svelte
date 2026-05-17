<script lang="ts">
	/**
	 * 分享解锁弹窗组件
	 * 显示分享链接和二维码，分享进度追踪
	 */
	import { copyToClipboard } from '$lib/utils';
	import type { ShareLink } from '$lib/types';

	interface Props {
		videoId: string;
		shareData?: ShareLink;
		onClose?: () => void;
		onShare?: (platform: string) => void;
	}

	let {
		videoId,
		shareData,
		onClose,
		onShare
	}: Props = $props();

	// 分享状态
	let copied = $state(false);
	let sharing = $state(false);

	// 分享链接
	const shareUrl = $derived(shareData?.url || `${window.location.origin}/v/${videoId}`);
	const unlockCount = $derived(shareData?.unlock_count || 0);
	const maxUnlock = $derived(shareData?.max_unlock || 5);
	const progress = $derived(Math.min((unlockCount / maxUnlock) * 100, 100));
	const isUnlocked = $derived(shareData?.is_unlocked || unlockCount >= maxUnlock);

	/**
	 * 复制链接
	 */
	async function handleCopy() {
		const success = await copyToClipboard(shareUrl);
		if (success) {
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		}
	}

	/**
	 * 分享到社交平台
	 */
	function handleShare(platform: string) {
		sharing = true;
		const text = `推荐一部好片：${shareUrl}`;

		switch (platform) {
			case 'twitter':
				window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
				break;
		}

		onShare?.(platform);

		// 模拟分享完成
		setTimeout(() => {
			sharing = false;
		}, 1000);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="fixed inset-0 z-50 flex items-center justify-center" onclick={onClose}>
	<!-- 遮罩层 -->
	<div class="absolute inset-0 bg-black/60"></div>

	<!-- 弹窗内容 -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="relative w-[320px] bg-white dark:bg-dark-card rounded-2xl p-5 mx-4 animate-slide-up"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- 关闭按钮 -->
		<button
			onclick={onClose}
			class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
				<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
			</svg>
		</button>

		<!-- 标题 -->
		<h3 class="text-base font-bold text-gray-900 dark:text-dark-text text-center mb-4">
			分享解锁
		</h3>

		<!-- 进度条 -->
		<div class="mb-4">
			<div class="flex items-center justify-between mb-1.5">
				<span class="text-xs text-gray-500 dark:text-dark-text-secondary">
					分享进度
				</span>
				<span class="text-xs text-bilibili font-medium">
					{unlockCount}/{maxUnlock} 次
				</span>
			</div>
			<div class="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-500"
					class:bg-bilibili={!isUnlocked}
					class:bg-green-500={isUnlocked}
					style="width: {progress}%"
				></div>
			</div>
			{#if isUnlocked}
				<p class="text-xs text-green-500 mt-1 text-center">已解锁全部内容</p>
			{:else}
				<p class="text-xs text-gray-400 mt-1 text-center">再分享 {maxUnlock - unlockCount} 次即可解锁</p>
			{/if}
		</div>

		<!-- 二维码区域 -->
		{#if shareData?.qrcode_url}
			<div class="flex justify-center mb-4">
				<div class="w-32 h-32 bg-gray-100 dark:bg-dark-border rounded-lg flex items-center justify-center overflow-hidden">
					<img
						src={shareData.qrcode_url}
						alt="分享二维码"
						class="w-full h-full object-contain"
						referrerpolicy="no-referrer"
					/>
				</div>
			</div>
		{/if}

		<!-- 复制链接 -->
		<button
			onclick={handleCopy}
			class="w-full py-2.5 bg-gray-100 dark:bg-dark-border rounded-lg text-sm text-gray-700 dark:text-dark-text btn-press flex items-center justify-center gap-2 mb-3"
		>
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
				<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
			</svg>
			{#if copied}
				<span class="text-green-500">已复制</span>
			{:else}
				复制链接
			{/if}
		</button>

		<!-- 社交平台分享按钮 -->
		<div class="flex gap-3">
			<button
				onclick={() => handleShare('twitter')}
				class="flex-1 py-2.5 bg-[#1DA1F2] text-white rounded-lg text-xs font-medium btn-press flex items-center justify-center gap-1.5"
				disabled={sharing}
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
					<path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
				</svg>
				X/Twitter
			</div>
	</div>
</div>
