<script lang="ts">
	/**
	 * 支付弹窗组件
	 * 支持支付方式选择、VIP 订阅、订单状态轮询
	 * 使用 Svelte 5 runes
	 */
	import { onMount } from 'svelte';
	import { getPaymentChannels, createPaymentOrder, getPaymentOrderStatus, getVIPPlans } from '$lib/api';
	import { PAYMENT_POLL_INTERVAL, PAYMENT_ORDER_EXPIRE, VIP_PLANS } from '$lib/constants';
	import { THEME } from '$lib/constants';
	import type { PaymentChannel, PaymentOrder, VIPPlan } from '$lib/types';
	import { hapticFeedback, isTGMiniApp } from '$lib/tg/miniapp';

	interface Props {
		/** 视频ID（可选，用于单视频解锁） */
		videoId?: string;
		/** 是否显示 */
		open: boolean;
		/** 关闭回调 */
		onClose: () => void;
		/** 支付成功回调 */
		onSuccess?: () => void;
	}

	let {
		videoId,
		open,
		onClose,
		onSuccess
	}: Props = $props();

	// 状态
	let channels = $state<PaymentChannel[]>([]);
	let plans = $state<VIPPlan[]>(VIP_PLANS);
	let selectedChannel = $state<PaymentChannel | null>(null);
	let selectedPlan = $state<VIPPlan | null>(null);
	let currentOrder = $state<PaymentOrder | null>(null);
	let step = $state<'select_plan' | 'select_channel' | 'paying' | 'result'>('select_plan');
	let payResult = $state<'success' | 'failed'>('success');
	let loading = $state(false);
	let error = $state('');
	let countdown = $state(0);

	// 轮询定时器
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	/**
	 * 加载支付渠道
	 */
	async function loadChannels(): Promise<void> {
		try {
			const res = await getPaymentChannels();
			if (res.code === 0 && res.data) {
				channels = res.data.channels.filter(c => c.is_active);
			}
		} catch {
			// 使用默认渠道
			channels = [
				{ id: 'usdt', name: 'USDT (TRC20)', icon: 'crypto', type: 'crypto', min_amount: 1, max_amount: 10000, is_active: true, sort_order: 1 },
				{ id: 'alipay', name: '支付宝', icon: 'alipay', type: 'alipay', min_amount: 0.01, max_amount: 50000, is_active: true, sort_order: 2 },
				{ id: 'wechat', name: '微信支付', icon: 'wechat', type: 'wechat', min_amount: 0.01, max_amount: 50000, is_active: true, sort_order: 3 }
			];
		}
	}

	/**
	 * 选择 VIP 套餐
	 */
	function selectPlan(plan: VIPPlan): void {
		selectedPlan = plan;
		if (isTGMiniApp()) hapticFeedback('light');
		step = 'select_channel';
	}

	/**
	 * 选择支付渠道
	 */
	function selectChannel(channel: PaymentChannel): void {
		selectedChannel = channel;
		if (isTGMiniApp()) hapticFeedback('light');
		createOrder();
	}

	/**
	 * 创建支付订单
	 */
	async function createOrder(): Promise<void> {
		if (!selectedChannel || !selectedPlan) return;

		loading = true;
		error = '';

		try {
			const res = await createPaymentOrder({
				channel_id: selectedChannel.id,
				plan_id: selectedPlan.id,
				video_id: videoId
			});

			if (res.code === 0 && res.data) {
				currentOrder = res.data.order;
				step = 'paying';
				startPolling();
			} else {
				error = res.message || '创建订单失败';
			}
		} catch (err) {
			error = '网络错误，请稍后重试';
		} finally {
			loading = false;
		}
	}

	/**
	 * 开始轮询订单状态
	 */
	function startPolling(): void {
		stopPolling();

		pollTimer = setInterval(async () => {
			if (!currentOrder) return;

			try {
				const res = await getPaymentOrderStatus(currentOrder.order_no);
				if (res.code === 0 && res.data) {
					const order = res.data.order;

					if (order.status === 'paid') {
						stopPolling();
						payResult = 'success';
						step = 'result';
						if (isTGMiniApp()) hapticFeedback('success');
						onSuccess?.();
					} else if (order.status === 'expired' || order.status === 'failed') {
						stopPolling();
						payResult = 'failed';
						step = 'result';
					}
				}
			} catch {
				// 轮询失败，继续
			}
		}, PAYMENT_POLL_INTERVAL);
	}

	/**
	 * 停止轮询
	 */
	function stopPolling(): void {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	/**
	 * 关闭弹窗
	 */
	function handleClose(): void {
		stopPolling();
		step = 'select_plan';
		selectedChannel = null;
		selectedPlan = null;
		currentOrder = null;
		error = '';
		onClose();
	}

	/**
	 * 重试支付
	 */
	function retry(): void {
		step = 'select_channel';
		currentOrder = null;
		error = '';
	}

	// 初始化
	$effect(() => {
		if (open) {
			loadChannels();
		}
	});

	// 清理
	onMount(() => {
		return () => stopPolling();
	});

	// 阻止点击穿透
	function handleOverlayClick(e: MouseEvent): void {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50"
		onclick={handleOverlayClick}
		role="dialog"
		aria-label="支付弹窗"
	>
		<div class="bg-white dark:bg-dark-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
			<!-- 标题栏 -->
			<div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
				<h3 class="text-lg font-bold text-gray-900 dark:text-dark-text">
					{step === 'select_plan' ? '选择套餐' : step === 'select_channel' ? '选择支付方式' : step === 'paying' ? '等待支付' : '支付结果'}
				</h3>
				<button
					onclick={handleClose}
					class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-500"
					aria-label="关闭"
				>
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
					</svg>
				</button>
			</div>

			<!-- 步骤 1: 选择套餐 -->
			{#if step === 'select_plan'}
				<div class="p-4 space-y-3">
					{#each plans as plan}
						<button
							onclick={() => selectPlan(plan)}
							class="w-full p-4 rounded-xl border-2 transition-all btn-press text-left"
							class:border-bilibili={selectedPlan?.id === plan.id}
							class:border-gray-200={selectedPlan?.id !== plan.id}
							class:dark:border-dark-border={selectedPlan?.id !== plan.id}
						>
							<div class="flex items-center justify-between">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-bold text-gray-900 dark:text-dark-text">{plan.name}</span>
										{#if plan.is_recommended}
											<span class="px-1.5 py-0.5 text-[10px] bg-bilibili text-white rounded-full">推荐</span>
										{/if}
									</div>
									<p class="text-xs text-gray-400 mt-1">{plan.description}</p>
									<p class="text-xs text-gray-400 mt-0.5">{plan.duration_days} 天</p>
								</div>
								<div class="text-right">
									<div class="text-lg font-bold text-bilibili">{'$'}{plan.price}</div>
									{#if plan.original_price > plan.price}
										<div class="text-xs text-gray-400 line-through">{'$'}{plan.original_price}</div>
									{/if}
								</div>
							</div>

							<!-- 功能列表 -->
							<div class="flex flex-wrap gap-1 mt-2">
								{#each plan.features as feature}
									<span class="px-2 py-0.5 text-[10px] bg-gray-50 dark:bg-dark-bg text-gray-500 rounded">
										{feature}
									</span>
								{/each}
							</div>
						</button>
					{/each}
				</div>
			{/if}

			<!-- 步骤 2: 选择支付渠道 -->
			{#if step === 'select_channel'}
				<div class="p-4">
					<!-- 订单金额 -->
					{#if selectedPlan}
						<div class="text-center mb-4 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
							<p class="text-sm text-gray-500">支付金额</p>
							<p class="text-2xl font-bold text-bilibili">${selectedPlan.price}</p>
							<p class="text-xs text-gray-400">{selectedPlan.name}</p>
						</div>
					{/if}

					<!-- 支付渠道列表 -->
					<div class="space-y-2">
						{#each channels as channel (channel.id)}
							<button
								onclick={() => selectChannel(channel)}
								class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-border btn-press"
							>
								<!-- 图标 -->
								<div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
									{#if channel.type === 'crypto'}
										<svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
										</svg>
									{:else if channel.type === 'alipay'}
										<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
											<path d="M21.422 15.358c-3.32-1.326-6.092-3.015-6.092-3.015s1.439-3.666 1.853-5.943H13V4.5h5V3h-5V0h-2.5v3H5.5v1.5H10.5v1.9H6v1.5h8.877c-.296 1.394-.96 3.382-.96 3.382s-4.142-1.8-7.917-1.8C2.5 10.482 2 13.5 2 13.5s-.5 4 5 4c3 0 5.5-2 5.5-2l1.5 1.5s2.5 1.5 5.5 1.5c3.5 0 5.5-2 5.5-2l-1.078-1.142zM7 15.5c-3.5 0-3.5-2-3.5-2s0-2 3-2c2.5 0 5 1.5 5 1.5S10 15.5 7 15.5z"/>
										</svg>
									{:else}
										<svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
											<path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
										</svg>
									{/if}
								</div>
								<div class="flex-1 text-left">
									<p class="text-sm font-medium text-gray-900 dark:text-dark-text">{channel.name}</p>
									<p class="text-[10px] text-gray-400">
										限额 {channel.min_amount} - {channel.max_amount}
									</p>
								</div>
								<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
								</svg>
							</button>
						{/each}
					</div>

					{#if error}
						<p class="text-xs text-red-500 text-center mt-3">{error}</p>
					{/if}

					{#if loading}
						<div class="flex justify-center mt-3">
							<div class="w-5 h-5 border-2 border-gray-300 border-t-bilibili rounded-full animate-spin"></div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- 步骤 3: 等待支付 -->
			{#if step === 'paying'}
				<div class="p-6 text-center">
					<div class="w-16 h-16 mx-auto mb-4 border-3 border-gray-200 border-t-bilibili rounded-full animate-spin"></div>
					<p class="text-base font-medium text-gray-900 dark:text-dark-text mb-2">等待支付...</p>
					<p class="text-sm text-gray-400 mb-4">请在 {PAYMENT_ORDER_EXPIRE / 60} 分钟内完成支付</p>

					{#if currentOrder?.pay_url}
						<a
							href={currentOrder.pay_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-block px-6 py-2.5 bg-bilibili text-white rounded-full text-sm font-medium btn-press"
						>
							前往支付
						</a>
					{/if}

					{#if currentOrder?.qrcode_url}
						<div class="mt-4">
							<img src={currentOrder.qrcode_url} alt="支付二维码" class="w-40 h-40 mx-auto rounded-lg" />
							<p class="text-xs text-gray-400 mt-2">请扫码支付</p>
						</div>
					{/if}

					<button
						onclick={retry}
						class="mt-4 text-sm text-gray-400 underline"
					>
						更换支付方式
					</button>
				</div>
			{/if}

			<!-- 步骤 4: 支付结果 -->
			{#if step === 'result'}
				<div class="p-6 text-center">
					{#if payResult === 'success'}
						<div class="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
							<svg class="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
							</svg>
						</div>
						<p class="text-lg font-bold text-gray-900 dark:text-dark-text mb-2">支付成功</p>
						<p class="text-sm text-gray-400 mb-4">
							{#if selectedPlan}
								已开通 {selectedPlan.name}
							{:else}
								解锁成功
							{/if}
						</p>
					{:else}
						<div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
							<svg class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
							</svg>
						</div>
						<p class="text-lg font-bold text-gray-900 dark:text-dark-text mb-2">支付失败</p>
						<p class="text-sm text-gray-400 mb-4">请重试或更换支付方式</p>
					{/if}

					<button
						onclick={handleClose}
						class="px-6 py-2.5 bg-bilibili text-white rounded-full text-sm font-medium btn-press"
					>
						完成
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
