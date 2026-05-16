<script lang="ts">
	/**
	 * 全局错误页面
	 * 处理 404、500 等错误状态
	 */
	import { page } from '$app/state';

	// 错误信息映射
	const errorMessages: Record<number, string> = {
		400: '请求参数错误',
		401: '登录已过期，请重新登录',
		403: '没有权限访问此页面',
		404: '页面不存在或已被移除',
		500: '服务器内部错误',
		502: '网关错误',
		503: '服务暂时不可用',
		504: '网关超时'
	};

	// 获取错误信息
	const status = $derived(page.status);
	const errorMessage = $derived(page.error?.message || errorMessages[status] || '发生未知错误');
	const isNotFound = $derived(status === 404);

	// 获取错误堆栈（仅在开发模式）
	const errorStack = $derived(
		import.meta.env.DEV && page.error && 'stack' in page.error
			? (page.error as Error).stack
			: null
	);
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-4 safe-bottom">
	<!-- 错误图标 -->
	<div class="w-24 h-24 mb-6 relative">
		{#if isNotFound}
			<!-- 404 图标 -->
			<svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-bilibili">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
				<path d="M8 15s1.5-2 4-2 4 2 4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				<circle cx="9" cy="10" r="1" fill="currentColor"/>
				<circle cx="15" cy="10" r="1" fill="currentColor"/>
				<path d="M7 7l2 2M17 7l-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		{:else}
			<!-- 通用错误图标 -->
			<svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-bilibili">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
				<path d="M12 7v6M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		{/if}
	</div>

	<!-- 错误代码 -->
	<h1 class="text-6xl font-bold text-bilibili mb-2">{status}</h1>

	<!-- 错误信息 -->
	<p class="text-lg text-text-secondary mb-8 text-center">{errorMessage}</p>

	<!-- 操作按钮 -->
	<div class="flex gap-4">
		<a
			href="/"
			class="px-6 py-2.5 bg-bilibili text-white rounded-full font-medium btn-press"
		>
			返回首页
		</a>
		<button
			onclick={() => window.location.reload()}
			class="px-6 py-2.5 border border-border-color text-text-primary rounded-full font-medium btn-press"
		>
			刷新页面
		</button>
	</div>

	<!-- 错误详情（开发模式显示） -->
	{#if errorStack()}
		<div class="mt-8 p-4 bg-dark-card rounded-lg max-w-2xl w-full overflow-auto">
			<pre class="text-xs text-text-secondary whitespace-pre-wrap">{errorStack()}</pre>
		</div>
	{/if}
</div>

<style>
	/* 错误页面动画 */
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	:global(.text-bilibili) {
		animation: float 3s ease-in-out infinite;
	}
</style>
