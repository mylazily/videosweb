<script lang="ts">
	/**
	 * 登录页
	 * 使用真实 API 调用替换模拟数据
	 */
	import { goto } from '$app/navigation';
	import { setToken, setRefreshToken, setUserInfo } from '$lib/auth';
	import { getBaseUrl } from '$lib/apiConfig';
	import type { User } from '$lib/types';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	// 登录
	async function handleLogin() {
		if (!username.trim()) {
			error = '请输入用户名';
			return;
		}
		if (!password.trim()) {
			error = '请输入密码';
			return;
		}

		loading = true;
		error = '';

		try {
			const base = getBaseUrl();
			const response = await fetch(`${base}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();

			if (!response.ok || data.code !== 0) {
				throw new Error(data.message || '登录失败');
			}

			// 保存 token
			setToken(data.data.token);
			if (data.data.refresh_token) {
				setRefreshToken(data.data.refresh_token);
			}
			setUserInfo(data.data.user);

			// 跳转到首页
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : '登录失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[80vh] px-6">
	<!-- Logo -->
	<div class="mb-8 text-center">
		<div class="w-16 h-16 mx-auto rounded-2xl bilibili-gradient flex items-center justify-center mb-3">
			<span class="text-2xl font-bold text-white">XV</span>
		</div>
		<h1 class="text-xl font-bold text-gray-900 dark:text-dark-text">XVideos 影视</h1>
		<p class="text-xs text-gray-400 mt-1">登录后享受更多功能</p>
	</div>

	<!-- 登录表单 -->
	<div class="w-full max-w-sm space-y-4">
		<!-- 错误提示 -->
		{#if error}
			<div class="px-3 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
				{error}
			</div>
		{/if}

		<!-- 用户名 -->
		<div>
			<input
				type="text"
				bind:value={username}
				placeholder="请输入用户名"
				class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
			/>
		</div>

		<!-- 密码 -->
		<div>
			<input
				type="password"
				bind:value={password}
				placeholder="请输入密码"
				class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
				onkeydown={(e) => e.key === 'Enter' && handleLogin()}
			/>
		</div>

		<!-- 登录按钮 -->
		<button
			onclick={handleLogin}
			disabled={loading}
			class="w-full py-3 text-sm text-white bg-bilibili rounded-xl btn-press disabled:opacity-50 transition-all"
		>
			{loading ? '登录中...' : '登录'}
		</button>

		<!-- 注册链接 -->
		<p class="text-center text-xs text-gray-400">
			还没有账号？
			<a href="/register" class="text-bilibili">立即注册</a>
		</p>
	</div>
</div>
