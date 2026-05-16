<script lang="ts">
	/**
	 * 登录页
	 * 与后端 /api/v1/auth/login 对接
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { setToken, setRefreshToken, setUserInfo } from '$lib/auth';
	import { getBaseUrl } from '$lib/apiConfig';

	// 从URL参数获取用户名（注册成功后跳转过来）
	let username = $state(page.url.searchParams.get('username') || '');
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
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`${base}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password }),
				signal: controller.signal
			});

			clearTimeout(timer);
			const data = await response.json();

			// 后端成功返回 code: 0
			if (data.code !== 0) {
				throw new Error(data.message || '登录失败');
			}

			// 保存 token
			if (data.data?.token) {
				setToken(data.data.token);
			}
			if (data.data?.refresh_token) {
				setRefreshToken(data.data.refresh_token);
			}
			if (data.data?.user) {
				setUserInfo(data.data.user);
			}

			// 跳转到首页
			goto('/');
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				error = '请求超时，请检查网络';
			} else {
				error = err instanceof Error ? err.message : '登录失败，请重试';
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-[#FAFAFA]">
	<div class="flex flex-col items-center justify-center min-h-[80vh] px-6">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] flex items-center justify-center mb-3">
				<svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
			<h1 class="text-xl font-bold text-gray-800">欢迎回来</h1>
			<p class="text-xs text-gray-400 mt-1">登录你的影视库账号</p>
		</div>

		<!-- 登录表单 -->
		<div class="w-full max-w-sm space-y-3">
			<!-- 错误提示 -->
			{#if error}
				<div class="px-3 py-2 text-xs text-red-500 bg-red-50 rounded-lg" style="animation: fadeIn 0.2s ease-out;">
					{error}
				</div>
			{/if}

			<!-- 用户名 -->
			<input
				type="text"
				bind:value={username}
				placeholder="请输入用户名"
				autocomplete="username"
				class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all"
			/>

			<!-- 密码 -->
			<input
				type="password"
				bind:value={password}
				placeholder="请输入密码"
				autocomplete="current-password"
				onkeydown={(e) => e.key === 'Enter' && handleLogin()}
				class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all"
			/>

			<!-- 登录按钮 -->
			<button
				onclick={handleLogin}
				disabled={loading}
				class="w-full py-3 text-sm text-white bg-[#FF6B9D] rounded-xl active:scale-[0.98] disabled:opacity-50 transition-all"
			>
				{loading ? '登录中...' : '登录'}
			</button>

			<!-- 注册链接 -->
			<p class="text-center text-xs text-gray-400">
				还没有账号？
				<a href="/register" class="text-[#FF6B9D] font-medium">立即注册</a>
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
