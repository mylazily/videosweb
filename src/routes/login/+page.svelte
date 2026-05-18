<script lang="ts">
	/**
	 * 登录页面组件
	 * 
	 * @description 用户登录页面，支持用户名/邮箱 + 密码登录
	 * @author VideosGo Team
	 * @since 1.0.0
	 */
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { setToken, setRefreshToken, setUserInfo } from '$lib/auth';
	import { getBaseUrl } from '$lib/apiConfig';
	import type { ApiResponse, LoginResponse } from '$lib/types';

	// ==================== 状态定义 ====================
	
	/** 用户名/邮箱输入值 */
	let username = $state(page.url.searchParams.get('username') ?? '');
	/** 密码输入值 */
	let password = $state('');
	/** 加载状态 */
	let isLoading = $state(false);
	/** 错误提示信息 */
	let errorMessage = $state('');

	// ==================== 常量定义 ====================
	
	/** 请求超时时间（毫秒） */
	const REQUEST_TIMEOUT_MS = 10000;
	/** 最小密码长度 */
	const MIN_PASSWORD_LENGTH = 6;
	/** 最小用户名长度 */
	const MIN_USERNAME_LENGTH = 3;

	// ==================== 验证函数 ====================
	
	/**
	 * 验证登录表单
	 * @returns 验证通过返回 true，否则返回 false 并设置错误信息
	 */
	function validateForm(): boolean {
		const trimmedUsername = username.trim();
		
		if (!trimmedUsername) {
			errorMessage = '请输入用户名或邮箱';
			return false;
		}
		
		if (trimmedUsername.length < MIN_USERNAME_LENGTH && !trimmedUsername.includes('@')) {
			errorMessage = `用户名至少需要 ${MIN_USERNAME_LENGTH} 个字符`;
			return false;
		}
		
		if (!password) {
			errorMessage = '请输入密码';
			return false;
		}
		
		if (password.length < MIN_PASSWORD_LENGTH) {
			errorMessage = `密码至少需要 ${MIN_PASSWORD_LENGTH} 个字符`;
			return false;
		}
		
		return true;
	}

	// ==================== API 错误处理 ====================
	
	/**
	 * 解析 API 错误响应
	 * @param response - fetch Response 对象
	 * @returns 解析后的错误信息
	 */
	async function parseApiError(response: Response): Promise<string> {
		const contentType = response.headers.get('content-type') ?? '';
		
		try {
			if (contentType.includes('application/json')) {
				const data = await response.json() as ApiResponse<unknown>;
				return data.message || `服务器错误 (${response.status})`;
			}
			
			// 处理非 JSON 响应（如 Cloudflare 错误页面）
			const text = await response.text();
			if (text.includes('error code:')) {
				return '服务器暂时不可用，请稍后重试';
			}
			return `服务器错误 (${response.status})`;
		} catch {
			return `服务器错误 (${response.status})`;
		}
	}

	// ==================== 登录处理 ====================
	
	/**
	 * 处理用户登录
	 * 
	 * @description 发送登录请求，处理成功保存 token 并跳转首页
	 * @returns Promise<void>
	 */
	async function handleLogin(): Promise<void> {
		if (!validateForm()) {
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const baseUrl = getBaseUrl();
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

			const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ 
					username: username.trim(), 
					password 
				}),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			// 处理 HTTP 错误状态
			if (!response.ok) {
				const errorMsg = await parseApiError(response);
				throw new Error(errorMsg);
			}

			const data = await response.json() as ApiResponse<LoginResponse>;

			// 处理业务逻辑错误
			if (data.code !== 0) {
				throw new Error(data.message || '登录失败，请检查用户名和密码');
			}

			// 验证必要字段
			if (!data.data?.access_token) {
				throw new Error('登录响应缺少必要数据');
			}

			// 保存认证信息
			setToken(data.data.access_token);
			
			if (data.data.refresh_token) {
				setRefreshToken(data.data.refresh_token);
			}
			
			if (data.data.user) {
				setUserInfo(data.data.user);
			}

			// 登录成功，跳转到首页
			await goto('/');
			
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				errorMessage = '请求超时，请检查网络连接后重试';
			} else if (error instanceof TypeError && error.message.includes('fetch')) {
				errorMessage = '网络连接失败，请检查网络设置';
			} else {
				errorMessage = error instanceof Error 
					? error.message 
					: '登录失败，请稍后重试';
			}
			
			console.error('[Login] 登录失败:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 处理键盘事件
	 * @param event - 键盘事件对象
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !isLoading) {
			handleLogin();
		}
	}
</script>

<div class="min-h-screen bg-[#FAFAFA]">
	<div class="flex flex-col items-center justify-center min-h-[80vh] px-6">
		<!-- Logo 区域 -->
		<div class="mb-8 text-center">
			<div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] flex items-center justify-center mb-3">
				<svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
			<h1 class="text-xl font-bold text-gray-800">欢迎回来</h1>
			<p class="text-xs text-gray-400 mt-1">登录你的影视库账号</p>
		</div>

		<!-- 登录表单 -->
		<form class="w-full max-w-sm space-y-3" onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			<!-- 错误提示 -->
			{#if errorMessage}
				<div 
					class="px-3 py-2 text-xs text-red-500 bg-red-50 rounded-lg animate-fade-in"
					role="alert"
					aria-live="polite"
				>
					{errorMessage}
				</div>
			{/if}

			<!-- 用户名/邮箱输入 -->
			<div class="space-y-1">
				<label for="username" class="sr-only">用户名或邮箱</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="请输入用户名或邮箱"
					autocomplete="username"
					disabled={isLoading}
					class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all disabled:opacity-50"
				/>
			</div>

			<!-- 密码输入 -->
			<div class="space-y-1">
				<label for="password" class="sr-only">密码</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="请输入密码"
					autocomplete="current-password"
					disabled={isLoading}
					onkeydown={handleKeyDown}
					class="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30 focus:border-[#FF6B9D]/50 transition-all disabled:opacity-50"
				/>
			</div>

			<!-- 登录按钮 -->
			<button
				type="submit"
				disabled={isLoading}
				class="w-full py-3 text-sm text-white bg-[#FF6B9D] rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#FF5A8F] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/50"
			>
				{isLoading ? '登录中...' : '登录'}
			</button>

			<!-- 注册链接 -->
			<p class="text-center text-xs text-gray-400">
				还没有账号？
				<a href="/register" class="text-[#FF6B9D] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/30 rounded">
					立即注册
				</a>
			</p>
		</form>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from { 
			opacity: 0; 
			transform: translateY(-8px); 
		}
		to { 
			opacity: 1; 
			transform: translateY(0); 
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.2s ease-out;
	}
</style>
