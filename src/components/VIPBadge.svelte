<script lang="ts">
	/**
	 * VIP 标识组件
	 * 显示 VIP 等级和到期时间
	 * 非 VIP 显示升级入口
	 * 使用 Svelte 5 runes
	 */
	import { THEME } from '$lib/constants';
	import type { VIPSubscription } from '$lib/types';

	interface Props {
		subscription: VIPSubscription | null;
		onUpgrade?: () => void;
		size?: 'small' | 'large';
	}

	let {
		subscription,
		onUpgrade,
		size = 'small'
	}: Props = $props();

	// 是否为 VIP
	let isVIP = $derived(subscription?.is_active ?? false);

	// VIP 等级
	let vipLevel = $derived(subscription?.level ?? 0);

	// 到期时间格式化
	let expireText = $derived(() => {
		if (!subscription?.expire_time) return '';
		const date = new Date(subscription.expire_time);
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

		if (days <= 0) return '已过期';
		if (days <= 7) return `${days}天后到期`;
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 到期`;
	});
</script>

{#if isVIP}
	<!-- VIP 标识 -->
	<div
		class="vip-badge"
		class:vip-badge-large={size === 'large'}
	>
		<div class="flex items-center gap-1">
			<svg class="vip-icon" viewBox="0 0 24 24" fill="currentColor">
				<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
			</svg>
			<span class="vip-text">VIP{vipLevel}</span>
		</div>
		{#if size === 'large'}
			<span class="vip-expire">{expireText()}</span>
		{/if}
	</div>
{:else}
	<!-- 升级入口 -->
	<button
		onclick={onUpgrade}
		class="upgrade-btn"
		class:upgrade-btn-large={size === 'large'}
	>
		<svg class="upgrade-icon" viewBox="0 0 24 24" fill="currentColor">
			<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
		</svg>
		<span>开通VIP</span>
	</button>
{/if}

<style>
	.vip-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		background: linear-gradient(135deg, #FFD700, #FFA500);
		border-radius: 999px;
		color: #7B3F00;
		font-weight: bold;
	}

	.vip-badge-large {
		flex-direction: column;
		padding: 8px 16px;
		gap: 4px;
	}

	.vip-icon {
		width: 14px;
		height: 14px;
	}

	.vip-badge-large .vip-icon {
		width: 20px;
		height: 20px;
	}

	.vip-text {
		font-size: 11px;
		line-height: 1;
	}

	.vip-badge-large .vip-text {
		font-size: 14px;
	}

	.vip-expire {
		font-size: 10px;
		font-weight: normal;
		opacity: 0.8;
	}

	.upgrade-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		background: linear-gradient(135deg, v-bind('THEME.PRIMARY'), v-bind('THEME.PRIMARY_DARK'));
		border-radius: 999px;
		color: white;
		font-size: 11px;
		font-weight: bold;
		border: none;
		cursor: pointer;
	}

	.upgrade-btn-large {
		padding: 8px 16px;
		font-size: 14px;
		gap: 6px;
	}

	.upgrade-icon {
		width: 14px;
		height: 14px;
	}

	.upgrade-btn-large .upgrade-icon {
		width: 20px;
		height: 20px;
	}
</style>
