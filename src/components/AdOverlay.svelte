<script lang="ts">
	/**
	 * 广告覆盖层组件
	 * 倒计时 30 秒，VIP 可直接跳过
	 * 广告展示完成回调
	 * 使用 Svelte 5 runes
	 */
	import { onMount, onDestroy } from 'svelte';
	import { AD_WATCH_DURATION } from '$lib/constants';

	interface Props {
		/** 是否为 VIP 用户 */
		isVIP?: boolean;
		/** 广告展示完成回调 */
		onComplete?: () => void;
		/** 跳过广告回调 */
		onSkip?: () => void;
		/** 广告内容（可选） */
		adContent?: string;
	}

	let {
		isVIP = false,
		onComplete,
		onSkip,
		adContent
	}: Props = $props();

	// 状态
	let countdown = $state(AD_WATCH_DURATION);
	let isCompleted = $state(false);
	// canSkip 使用 derived 状态，根据 VIP 状态和倒计时结束动态计算
	let canSkip = $derived(isVIP || isCompleted);
	let timer: ReturnType<typeof setInterval> | null = null;

	/**
	 * 跳过广告
	 */
	function handleSkip(): void {
		if (!canSkip && !isVIP) return;

		clearTimer();
		onSkip?.();
	}

	/**
	 * 倒计时结束
	 */
	function handleCountdownEnd(): void {
		isCompleted = true;
		canSkip = true;
		clearTimer();
		onComplete?.();
	}

	/**
	 * 清除定时器
	 */
	function clearTimer(): void {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	// VIP 用户自动跳过
	$effect(() => {
		if (isVIP) {
			canSkip = true;
			clearTimer();
		}
	});

	onMount(() => {
		if (!isVIP) {
			timer = setInterval(() => {
				countdown--;
				if (countdown <= 0) {
					handleCountdownEnd();
				}
			}, 1000);
		}
	});

	onDestroy(() => {
		clearTimer();
	});

	// 格式化倒计时
	let formattedTime = $derived(() => {
		const seconds = Math.max(0, countdown);
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	});
</script>

<div class="ad-overlay">
	<!-- 广告内容区域 -->
	<div class="ad-content">
		{#if adContent}
			<!-- 自定义广告内容 -->
			<div class="ad-custom">
				{@html adContent}
			</div>
		{:else}
			<!-- 默认广告占位 -->
			<div class="ad-placeholder">
				<div class="ad-placeholder-inner">
					<svg class="w-12 h-12 text-gray-300 mb-2" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
					</svg>
					<p class="text-sm text-gray-400">广告展示中</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- 底部操作栏 -->
	<div class="ad-bottom-bar">
		{#if isCompleted}
			<!-- 广告完成 -->
			<button
				onclick={handleSkip}
				class="ad-skip-btn ad-skip-ready"
			>
				广告已结束，点击继续
			</button>
		{:else if isVIP}
			<!-- VIP 跳过 -->
			<button
				onclick={handleSkip}
				class="ad-skip-btn ad-skip-vip"
			>
				VIP 免广告 - 点击跳过
			</button>
		{:else}
			<!-- 倒计时 -->
			<div class="ad-countdown-area">
				<span class="ad-countdown-text">{formattedTime()}</span>
				<button
					onclick={handleSkip}
					disabled={!canSkip}
					class="ad-skip-btn"
					class:ad-skip-disabled={!canSkip}
				>
					{canSkip ? '跳过广告' : `${countdown}s 后可跳过`}
				</button>
			</div>
		{/if}

		<!-- 广告标识 -->
		<span class="ad-label">广告</span>
	</div>
</div>

<style>
	.ad-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.9);
	}

	.ad-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ad-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ad-placeholder-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.ad-bottom-bar {
		position: relative;
		padding: 16px;
		text-align: center;
	}

	.ad-countdown-area {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.ad-countdown-text {
		font-size: 18px;
		font-weight: bold;
		color: white;
		font-variant-numeric: tabular-nums;
	}

	.ad-skip-btn {
		padding: 8px 20px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.7);
		transition: all 0.3s ease;
	}

	.ad-skip-btn:disabled {
		cursor: not-allowed;
	}

	.ad-skip-disabled {
		opacity: 0.5;
	}

	.ad-skip-ready {
		background: #4CAF50;
		color: white;
		font-size: 16px;
		padding: 12px 32px;
		animation: pulse 1.5s ease infinite;
	}

	.ad-skip-vip {
		background: linear-gradient(135deg, #FFD700, #FFA500);
		color: #7B3F00;
		font-weight: bold;
	}

	.ad-label {
		position: absolute;
		top: 8px;
		right: 16px;
		font-size: 10px;
		color: rgba(255, 255, 255, 0.4);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
</style>
