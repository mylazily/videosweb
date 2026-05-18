<script lang="ts">
	/**
	 * 金币解锁按钮
	 * 显示所需金币数，余额不足时提示
	 * 解锁成功动画
	 * 使用 Svelte 5 runes
	 */
	import { adminUnlockVideo, getRewardBalance } from '$lib/api';
	import { THEME } from '$lib/constants';

	interface Props {
		videoId: string;
		requiredCoins: number;
		onSuccess?: () => void;
	}

	let {
		videoId,
		requiredCoins,
		onSuccess
	}: Props = $props();

	// 状态
	let balance = $state(0);
	let loading = $state(false);
	let unlocked = $state(false);
	let showSuccess = $state(false);
	let showInsufficient = $state(false);
	let error = $state('');

	// 余额是否充足
	let sufficient = $derived(balance >= requiredCoins);

	/**
	 * 加载金币余额
	 */
	async function loadBalance(): Promise<void> {
		try {
			const res = await getRewardBalance();
			if (res.code === 0 && res.data) {
				balance = typeof res.data.balance === 'number' ? res.data.balance : (res.data.balance as any)?.amount || 0;
			}
		} catch {
			// 忽略
		}
	}

	/**
	 * 执行解锁
	 */
	async function handleUnlock(): Promise<void> {
		if (loading || unlocked) return;

		if (!sufficient) {
			showInsufficient = true;
			setTimeout(() => { showInsufficient = false; }, 2000);
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await adminUnlockVideo({ user_id: '', video_id: videoId });
			if (res.code === 0 && res.data) {
				const unlockData = res.data as { success?: boolean; balance_after?: number };
				if (unlockData.success) {
					unlocked = true;
					showSuccess = true;
					balance = unlockData.balance_after ?? balance;
					onSuccess?.();

					setTimeout(() => { showSuccess = false; }, 3000);
				} else {
					error = res.message || '解锁失败';
				}
			} else {
				error = res.message || '解锁失败';
			}
		} catch {
			error = '网络错误，请稍后重试';
		} finally {
			loading = false;
		}
	}

	// 初始化时加载余额
	loadBalance();
</script>

<button
	onclick={handleUnlock}
	disabled={loading || unlocked}
	class="coin-unlock-btn"
	class:unlocked={unlocked}
	class:insufficient={showInsufficient}
	class:loading={loading}
	aria-label={unlocked ? '已解锁' : `花费 ${requiredCoins} 金币解锁`}
>
	{#if loading}
		<!-- 加载中 -->
		<div class="flex items-center gap-1">
			<div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
			<span>解锁中...</span>
		</div>
	{:else if unlocked}
		<!-- 已解锁 -->
		<div class="flex items-center gap-1 success-anim">
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
				<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
			</svg>
			<span>已解锁</span>
		</div>
	{:else}
		<!-- 默认状态 -->
		<div class="flex items-center gap-1">
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</svg>
			<span>{requiredCoins} 金币解锁</span>
		</div>
	{/if}
</button>

<!-- 余额不足提示 -->
{#if showInsufficient}
	<div class="insufficient-tip">
		余额不足，当前 {balance} 金币
	</div>
{/if}

<!-- 错误提示 -->
{#if error}
	<div class="error-tip">
		{error}
	</div>
{/if}

<style>
	.coin-unlock-btn {
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		background: linear-gradient(135deg, #FFD700, #FFA500);
		color: #7B3F00;
		border: none;
		border-radius: 999px;
		font-size: 13px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.coin-unlock-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.coin-unlock-btn.unlocked {
		background: linear-gradient(135deg, #4CAF50, #45a049);
		color: white;
	}

	.coin-unlock-btn.insufficient {
		animation: shake 0.3s ease;
	}

	.coin-unlock-btn.loading {
		background: linear-gradient(135deg, #9E9E9E, #757575);
		color: white;
	}

	.success-anim {
		animation: pop 0.3s ease;
	}

	.insufficient-tip {
		margin-top: 4px;
		font-size: 11px;
		color: #F44336;
		text-align: center;
	}

	.error-tip {
		margin-top: 4px;
		font-size: 11px;
		color: #F44336;
		text-align: center;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-4px); }
		75% { transform: translateX(4px); }
	}

	@keyframes pop {
		0% { transform: scale(1); }
		50% { transform: scale(1.1); }
		100% { transform: scale(1); }
	}
</style>
