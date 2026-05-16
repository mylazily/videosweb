<script lang="ts">
	/**
	 * 注册页
	 * 使用真实 API 调用替换模拟数据
	 */
	import { goto } from '$app/navigation';
	import { setToken, setUserInfo } from '$lib/auth';
	import { getBaseUrl } from '$lib/apiConfig';
	import type { User } from '$lib/types';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');

	// 注册
	async function handleRegister() {
		// 表单验证
		if (!username.trim()) {
			error = '请输入用户名';
			return;
		}
		if (username.trim().length < 3) {
			error = '用户名至少3个字符';
			return;
		}
		if (!email.trim()) {
			error = '请输入邮箱';
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			error = '请输入有效的邮箱地址';
			return;
		}
		if (!password.trim()) {
			error = '请输入密码';
			return;
		}
		if (password.length < 6) {
			error = '密码至少6个字符';
			return;
		}
		if (password !== confirmPassword) {
			error = '两次密码输入不一致';
			return;
		}

		loading = true;
		error = '';

		try {
			const base = getBaseUrl();
			const response = await fetch(`${base}/api/v1/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});

			const data = await response.json();

			if (!response.ok || data.code !== 0) {
				throw new Error(data.message || '注册失败');
			}

			// 保存 token 和用户信息
			setToken(data.data.token);
			setUserInfo(data.data.user);

			// 跳转到首页
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : '注册失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[80vh] px-6">
	<!-- Logo -->
	<div class="mb-6 text-center">
		<div class="w-16 h-16 mx-auto rounded-2xl bilibili-gradient flex items-center justify-center mb-3">
			<span class="text-2xl font-bold text-white">XV</span>
		</div>
		<h1 class="text-xl font-bold text-gray-900 dark:text-dark-text">注册账号</h1>
		<p class="text-xs text-gray-400 mt-1">创建你的 XVideos 影视账号</p>
	</div>

	<!-- 注册表单 -->
	<div class="w-full max-w-sm space-y-3">
		<!-- 错误提示 -->
		{#if error}
			<div class="px-3 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
				{error}
			</div>
		{/if}

		<!-- 用户名 -->
		<input
			type="text"
			bind:value={username}
			placeholder="请输入用户名（至少3个字符）"
			class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
		/>

		<!-- 邮箱 -->
		<input
			type="email"
			bind:value={email}
			placeholder="请输入邮箱"
			class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
		/>

		<!-- 密码 -->
		<input
			type="password"
			bind:value={password}
			placeholder="请输入密码（至少6个字符）"
			class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
		/>

		<!-- 确认密码 -->
		<input
			type="password"
			bind:value={confirmPassword}
			placeholder="请再次输入密码"
			class="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-dark-border rounded-xl outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-400 focus:ring-2 focus:ring-bilibili/30 transition-all"
			onkeydown={(e) => e.key === 'Enter' && handleRegister()}
		/>

		<!-- 注册按钮 -->
		<button
			onclick={handleRegister}
			disabled={loading}
			class="w-full py-3 text-sm text-white bg-bilibili rounded-xl btn-press disabled:opacity-50 transition-all"
		>
			{loading ? '注册中...' : '注册'}
		</button>

		<!-- 登录链接 -->
		<p class="text-center text-xs text-gray-400">
			已有账号？
			<a href="/login" class="text-bilibili">立即登录</a>
		</p>
	</div>
</div>
