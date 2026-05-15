<script lang="ts">
	/**
	 * 广告金币面板
	 * 金币余额显示、每日任务列表、任务完成进度、金币流水记录
	 * 使用 Svelte 5 runes
	 */
	import { onMount } from 'svelte';
	import { getCoinBalance, getDailyTasks, getCoinTransactions, dailyCheckin } from '$lib/api';
	import { THEME, CHECKIN_REWARD, AD_REWARD, SHARE_REWARD, INVITE_REWARD } from '$lib/constants';
	import { hapticFeedback, isTGMiniApp } from '$lib/tg/miniapp';
	import type { AdTask, CoinTransaction } from '$lib/types';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let {
		open,
		onClose
	}: Props = $props();

	// 状态
	let balance = $state(0);
	let frozenAmount = $state(0);
	let tasks = $state<AdTask[]>([]);
	let transactions = $state<CoinTransaction[]>([]);
	let activeTab = $state<'tasks' | 'records'>('tasks');
	let loading = $state(false);
	let checkinLoading = $state(false);

	/**
	 * 加载金币余额
	 */
	async function loadBalance(): Promise<void> {
		try {
			const res = await getCoinBalance();
			if (res.code === 0 && res.data) {
				balance = res.data.balance.amount;
				frozenAmount = res.data.balance.frozen_amount;
			}
		} catch {
			// 忽略
		}
	}

	/**
	 * 加载每日任务
	 */
	async function loadTasks(): Promise<void> {
		try {
			const res = await getDailyTasks();
			if (res.code === 0 && res.data) {
				tasks = res.data.tasks;
			}
		} catch {
			// 使用默认任务
			tasks = [
				{ id: 'checkin', type: 'checkin', name: '每日签到', description: '每天签到领取金币', reward_amount: CHECKIN_REWARD, icon: 'checkin', is_completed: false, completed_count: 0, max_count: 1 },
				{ id: 'watch_ad', type: 'watch_ad', name: '看广告', description: '观看广告获取金币', reward_amount: AD_REWARD, icon: 'ad', is_completed: false, completed_count: 0, max_count: 10 },
				{ id: 'share', type: 'share', name: '分享视频', description: '分享视频到社交平台', reward_amount: SHARE_REWARD, icon: 'share', is_completed: false, completed_count: 0, max_count: 5 },
				{ id: 'invite', type: 'invite', name: '邀请好友', description: '邀请新用户注册', reward_amount: INVITE_REWARD, icon: 'invite', is_completed: false, completed_count: 0, max_count: 99 }
			];
		}
	}

	/**
	 * 加载金币流水
	 */
	async function loadTransactions(): Promise<void> {
		loading = true;
		try {
			const res = await getCoinTransactions({ page: 1, page_size: 20 });
			if (res.code === 0 && res.data) {
				transactions = res.data.transactions;
			}
		} catch {
			// 忽略
		} finally {
			loading = false;
		}
	}

	/**
	 * 执行签到
	 */
	async function handleCheckin(): Promise<void> {
		if (checkinLoading) return;
		checkinLoading = true;

		try {
			const res = await dailyCheckin();
			if (res.code === 0 && res.data) {
				balance += res.data.reward;
				// 更新任务状态
				tasks = tasks.map(t =>
					t.type === 'checkin' ? { ...t, is_completed: true, completed_count: 1 } : t
				);
				if (isTGMiniApp()) hapticFeedback('success');
			}
		} catch {
			// 忽略
		} finally {
			checkinLoading = false;
		}
	}

	/**
	 * 获取任务图标
	 */
	function getTaskIcon(type: string): string {
		switch (type) {
			case 'checkin': return '📅';
			case 'watch_ad': return '📺';
			case 'share': return '📤';
			case 'invite': return '👥';
			default: return '🎯';
		}
	}

	/**
	 * 格式化时间
	 */
	function formatTime(timeStr: string): string {
		const date = new Date(timeStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();

		if (diff < 60000) return '刚刚';
		if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
		return `${date.getMonth() + 1}/${date.getDate()}`;
	}

	// 加载数据
	$effect(() => {
		if (open) {
			loadBalance();
			loadTasks();
		}
	});

	// 切换标签
	$effect(() => {
		if (open && activeTab === 'records' && transactions.length === 0) {
			loadTransactions();
		}
	});

	// 阻止点击穿透
	function handleOverlayClick(e: MouseEvent): void {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50"
		onclick={handleOverlayClick}
		role="dialog"
		aria-label="金币面板"
	>
		<div class="bg-white dark:bg-dark-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
			<!-- 标题栏 -->
			<div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
				<h3 class="text-lg font-bold text-gray-900 dark:text-dark-text">我的金币</h3>
				<button
					onclick={onClose}
					class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-500"
					aria-label="关闭"
				>
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
					</svg>
				</button>
			</div>

			<!-- 金币余额 -->
			<div class="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs text-gray-500">可用金币</p>
						<div class="flex items-baseline gap-1 mt-1">
							<span class="text-3xl font-bold text-orange-500">{balance}</span>
							{#if frozenAmount > 0}
								<span class="text-xs text-gray-400">(冻结 {frozenAmount})</span>
							{/if}
						</div>
					</div>
					<div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
						<span class="text-xl font-bold text-white">$</span>
					</div>
				</div>
			</div>

			<!-- 标签切换 -->
			<div class="flex border-b border-gray-100 dark:border-dark-border">
				<button
					onclick={() => activeTab = 'tasks'}
					class="flex-1 py-3 text-sm font-medium text-center transition-colors"
					class:text-bilibili={activeTab === 'tasks'}
					class:text-gray-400={activeTab !== 'tasks'}
					class:border-b-2={activeTab === 'tasks'}
					class:border-bilibili={activeTab === 'tasks'}
				>
					每日任务
				</button>
				<button
					onclick={() => activeTab = 'records'}
					class="flex-1 py-3 text-sm font-medium text-center transition-colors"
					class:text-bilibili={activeTab === 'records'}
					class:text-gray-400={activeTab !== 'records'}
					class:border-b-2={activeTab === 'records'}
					class:border-bilibili={activeTab === 'records'}
				>
					金币流水
				</button>
			</div>

			<!-- 内容区域 -->
			<div class="flex-1 overflow-y-auto">
				{#if activeTab === 'tasks'}
					<!-- 每日任务列表 -->
					<div class="p-4 space-y-3">
						{#each tasks as task (task.id)}
							<div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
								<!-- 图标 -->
								<div class="w-10 h-10 rounded-lg bg-white dark:bg-dark-card flex items-center justify-center text-lg">
									{getTaskIcon(task.type)}
								</div>

								<!-- 信息 -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium text-gray-900 dark:text-dark-text">{task.name}</span>
										<span class="text-xs text-orange-500 font-medium">+{task.reward_amount}</span>
									</div>
									<p class="text-xs text-gray-400 mt-0.5">{task.description}</p>
									<!-- 进度 -->
									{#if task.max_count > 1}
										<div class="flex items-center gap-2 mt-1">
											<div class="flex-1 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
												<div
													class="h-full bg-bilibili rounded-full transition-all"
													style="width: {(task.completed_count / task.max_count) * 100}%"
												></div>
											</div>
											<span class="text-[10px] text-gray-400">{task.completed_count}/{task.max_count}</span>
										</div>
									{/if}
								</div>

								<!-- 操作按钮 -->
								{#if task.type === 'checkin'}
									<button
										onclick={handleCheckin}
										disabled={task.is_completed || checkinLoading}
										class="px-3 py-1.5 text-xs rounded-full font-medium btn-press whitespace-nowrap"
										class:bg-bilibili={!task.is_completed}
										class:bg-gray-300={task.is_completed}
										class:text-white={true}
									>
										{#if checkinLoading}
											<div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
										{:else if task.is_completed}
											已签到
										{:else}
											签到
										{/if}
									</button>
								{:else if task.is_completed && task.completed_count >= task.max_count}
									<span class="text-xs text-green-500 font-medium">已完成</span>
								{:else}
									<button class="px-3 py-1.5 text-xs bg-bilibili text-white rounded-full font-medium btn-press whitespace-nowrap">
										去完成
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<!-- 金币流水 -->
					<div class="p-4">
						{#if loading}
							<div class="flex justify-center py-8">
								<div class="w-5 h-5 border-2 border-gray-300 border-t-bilibili rounded-full animate-spin"></div>
							</div>
						{:else if transactions.length === 0}
							<div class="text-center py-8 text-sm text-gray-400">
								暂无金币记录
							</div>
						{:else}
							<div class="space-y-2">
								{#each transactions as tx (tx.id)}
									<div class="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-border last:border-0">
										<div>
											<p class="text-sm text-gray-900 dark:text-dark-text">{tx.reason}</p>
											<p class="text-[10px] text-gray-400">{formatTime(tx.create_time)}</p>
										</div>
										<span class="text-sm font-medium" class:text-green-500={tx.type === 'earn'} class:text-red-500={tx.type === 'spend'}>
											{tx.type === 'earn' ? '+' : '-'}{tx.amount}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
