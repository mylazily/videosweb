<script lang="ts">
	/**
	 * Push 推送订阅引导弹窗
	 * PWA 安装 + Push 订阅引导
	 * 仅在用户首次访问时显示一次（使用 localStorage 记录）
	 */
	import { onMount } from 'svelte';
	import { isPushSupported, getPushPermissionStatus, subscribePush, isSubscribed } from '$lib/push/subscription';
	import { canInstall, promptInstall, isInstalled, isInstallDismissed, setInstallDismissed } from '$lib/pwa/install';
	import { PUSH_PROMPT_DISMISSED_KEY, THEME } from '$lib/constants';

	// 弹窗显示状态
	let visible = $state(false);
	let pushEnabled = $state(false);
	let pushLoading = $state(false);
	let pushSupported = $state(false);
	let pwaInstallable = $state(false);
	let alreadyInstalled = $state(false);

	onMount(async () => {
		// 检查是否已关闭过提示
		try {
			const dismissed = localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY);
			if (dismissed === 'true') return;
		} catch {
			// 忽略
		}

		// 检查是否已安装 PWA
		alreadyInstalled = isInstalled();

		// 检查 Push 支持
		pushSupported = isPushSupported();

		// 检查 PWA 安装
		pwaInstallable = canInstall() && !alreadyInstalled;

		// 检查是否已订阅
		if (pushSupported) {
			const subscribed = await isSubscribed();
			pushEnabled = subscribed;
		}

		// 如果有可引导的内容，显示弹窗
		if (pwaInstallable || (pushSupported && !pushEnabled)) {
			visible = true;
		}
	});

	/**
	 * 关闭弹窗
	 */
	function handleClose() {
		visible = false;
		try {
			localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, 'true');
		} catch {
			// 忽略
		}
	}

	/**
	 * 安装 PWA
	 */
	async function handleInstall() {
		const installed = await promptInstall();
		if (installed) {
			pwaInstallable = false;
			alreadyInstalled = true;
		}
	}

	/**
	 * 切换推送通知
	 */
	async function handleTogglePush() {
		if (pushLoading) return;
		pushLoading = true;

		try {
			if (pushEnabled) {
				// 取消订阅（暂不实现取消，仅关闭开关）
				pushEnabled = false;
			} else {
				// 请求权限并订阅
				const result = await subscribePush();
				pushEnabled = !!result;
			}
		} catch {
			pushEnabled = false;
		} finally {
			pushLoading = false;
		}
	}
</script>

{#if visible}
	<!-- 遮罩层 -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
		onclick={handleClose}
		role="dialog"
		aria-modal="true"
		aria-label="推送订阅引导"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md bg-white dark:bg-dark-card rounded-t-2xl p-5 pb-8 animate-slide-up"
			onclick={(e) => e.stopPropagation()}
			style="padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));"
		>
			<!-- 关闭按钮 -->
			<button
				onclick={handleClose}
				class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
				aria-label="关闭"
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>

			<!-- 图标 -->
			<div class="flex justify-center mb-4">
				<div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: {THEME.PRIMARY}20;">
					<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={THEME.PRIMARY} stroke-width="2">
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
						<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
					</svg>
				</div>
			</div>

			<!-- 标题 -->
			<h2 class="text-lg font-bold text-gray-900 dark:text-dark-text text-center mb-2">
				开启推送通知
			</h2>
			<p class="text-sm text-gray-500 dark:text-dark-text-secondary text-center mb-5">
				及时获取最新影视推荐和更新提醒
			</p>

			<!-- PWA 安装引导 -->
			{#if pwaInstallable}
				<button
					onclick={handleInstall}
					class="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all btn-press mb-3"
					style="background-color: {THEME.PRIMARY};"
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7 10 12 15 17 10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					添加到主屏幕
				</button>
			{/if}

			<!-- Push 订阅开关 -->
			{#if pushSupported}
				<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-border rounded-xl">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
							<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
						</svg>
						<span class="text-sm text-gray-700 dark:text-dark-text">推送通知</span>
					</div>
					<!-- 开关按钮 -->
					<button
						onclick={handleTogglePush}
						class="relative w-12 h-6 rounded-full transition-colors duration-200"
						class:bg-bilibili={pushEnabled}
						class:bg-gray-300={!pushEnabled}
						aria-label="切换推送通知"
						disabled={pushLoading}
					>
						<div
							class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
							class:translate-x-6={pushEnabled}
							class:translate-x-0.5={!pushEnabled}
						></div>
					</button>
				</div>
			{/if}

			<!-- 稍后按钮 -->
			<button
				onclick={handleClose}
				class="w-full py-2.5 text-sm text-gray-400 mt-3 btn-press"
			>
				稍后再说
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
