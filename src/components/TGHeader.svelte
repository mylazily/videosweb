<script lang="ts">
	/**
	 * TG Mini App 专用顶部栏
	 * 使用 TG SDK 的 back button
	 * 适配 TG 主题色
	 */
	import { onMount } from 'svelte';
	import { isTGMiniApp, showBackButton, hideBackButton, hapticFeedback } from '$lib/tg/miniapp';

	interface Props {
		title?: string;
	}

	let { title = 'XVideos 影视' }: Props = $props();

	// 是否在 TG 环境中
	let inTG = $state(false);

	onMount(() => {
		inTG = isTGMiniApp();

		if (inTG) {
			// 显示 TG 返回按钮
			showBackButton(() => {
				hapticFeedback('light');
				// 返回上一页
				if (window.history.length > 1) {
					window.history.back();
				}
			});
		}

		return () => {
			if (inTG) {
				hideBackButton();
			}
		};
	});
</script>

{#if inTG}
	<!-- TG Mini App 专用顶部栏 -->
	<div class="tg-header">
		<div class="flex items-center justify-center h-full px-12">
			<h1 class="text-base font-bold text-white truncate">{title}</h1>
		</div>
	</div>
{/if}

<style>
	.tg-header {
		height: 48px;
		background: var(--tg-bg-color, #1a1a2e);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}
</style>
