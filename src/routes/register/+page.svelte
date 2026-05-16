<script lang="ts">
	/**
	 * 注册页
	 * 只需用户名 + 密码，注册成功后跳转登录页
	 */
	import { goto } from '$app/navigation';
	import { getBaseUrl } from '$lib/apiConfig';

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

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
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`${base}/api/v1/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password }),
				signal: controller.signal
			});

			clearTimeout(timer);
			const data = await response.json();

			// 后端成功返回 code: 0
			if (data.code !== 0) {
				throw new Error(data.message || '注册失败');
			}

			// 注册成功，显示成功状态
			success = true;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				error = '请求超时，请检查网络';
			} else {
				error = err instanceof Error ? err.message : '注册失败，请重试';
			}
		} finally {
			loading = false;
		}
	}

	// 跳转登录
	function goLogin() {
		goto(`/login?username=${encodeURIComponent(username.trim())}`);
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
			<h1 class="text-xl font-bold text-gray-800">注册账号</h1>
			<p class="text-xs text-gray-400 mt-1">创建你的影视库账号</p>
		</div>

		{#if success}
			<!-- 注册成功 -->
			<div class="w-full max-w-sm text-center" style="animation: fadeIn 0.3s ease-out;">
				<div class="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
					<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
				</div>
				<h2 class="text-base font-bold text-gray-800 mb-1">注册成功！</h2>
				<p class="text-sm text-gray-500 mb-6">请使用账号密码登录</p>
				<button
					onclick={goLogin}
					class="w-full py-3 text-sm text-white bg-[#FF6B9D] rounded-xl active:scale-[0.98] transition-transform"
				>
					立即登录
				</button>
			</div>
		{:else}
			<!-- 注册表单 -->
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
					placeholder="请输入用户名（至少3个字符）"
					autocomplete="username"
					class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all"
				/>

				<!-- 密码 -->
				<input
					type="password"
					bind:value={password}
					placeholder="请输入密码（至少6个字符）"
					autocomplete="new-password"
					class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all"
				/>

				<!-- 确认密码 -->
				<input
					type="password"
					bind:value={confirmPassword}
					placeholder="请再次输入密码"
					autocomplete="new-password"
					onkeydown={(e) => e.key === 'Enter' && handleRegister()}
					class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all"
				/>

				<!-- 注册按钮 -->
				<button
					onclick={handleRegister}
					disabled={loading}
					class="w-full py-3 text-sm text-white bg-[#FF6B9D] rounded-xl active:scale-[0.98] disabled:opacity-50 transition-all"
				>
					{loading ? '注册中...' : '注册'}
				</button>

				<!-- 登录链接 -->
				<p class="text-center text-xs text-gray-400">
					已有账号？
					<a href="/login" class="text-[#FF6B9D] font-medium">立即登录</a>
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
