<script lang="ts">
	/**
	 * 个人中心页
	 */
	import { isLoggedIn, getUserInfo, clearTokens } from '$lib/auth';
	import type { User } from '$lib/types';

	let { data } = $props();

	let user = $state<User | null>(data.user || null);
	let loggedIn = $state(isLoggedIn());

	// 功能菜单
	const menuItems = [
		{ icon: '&#128266;', label: '观看历史', path: '/history' },
		{ icon: '&#10084;&#65039;', label: '我的收藏', path: '/profile' },
		{ icon: '&#128172;', label: '我的评论', path: '/profile' },
		{ icon: '&#128276;', label: '消息通知', path: '/profile' },
		{ icon: '&#127912;', label: '意见反馈', path: '/profile' },
		{ icon: '&#9881;&#65039;', label: '设置', path: '/profile' }
	];

	// 退出登录
	function handleLogout() {
		if (confirm('确定要退出登录吗？')) {
			clearTokens();
			loggedIn = false;
			user = null;
		}
	}
</script>

<div class="safe-bottom">
	{#if loggedIn && user}
		<!-- 用户信息卡片 -->
		<div class="mx-4 mt-3 p-4 rounded-xl bg-gradient-to-br from-bilibili to-bilibili-dark text-white">
			<div class="flex items-center gap-3">
				<img
					src={user.avatar}
					alt={user.username}
					class="w-14 h-14 rounded-full border-2 border-white/30 object-cover"
					referrerpolicy="no-referrer"
				/>
				<div>
					<h2 class="text-lg font-bold">{user.username}</h2>
					{#if user.vip_level > 0}
						<span class="inline-block mt-0.5 px-2 py-0.5 text-[10px] bg-yellow-500/80 text-white rounded-full">
							VIP {user.vip_level}
						</span>
					{/if}
				</div>
			</div>

			<!-- 统计数据 -->
			<div class="flex items-center justify-around mt-4 pt-3 border-t border-white/20">
				<div class="text-center">
					<p class="text-lg font-bold">{data.stats?.watchCount || 0}</p>
					<p class="text-[10px] text-white/70">观看</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-bold">{data.stats?.favoriteCount || 0}</p>
					<p class="text-[10px] text-white/70">收藏</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-bold">{data.stats?.commentCount || 0}</p>
					<p class="text-[10px] text-white/70">评论</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-bold">{data.stats?.followCount || 0}</p>
					<p class="text-[10px] text-white/70">关注</p>
				</div>
			</div>
		</div>

		<!-- 功能菜单 -->
		<div class="mx-4 mt-4 bg-white dark:bg-dark-card rounded-xl overflow-hidden">
			{#each menuItems as item, i}
				<a
					href={item.path}
					class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-dark-border last:border-0 btn-press"
				>
					<span class="text-lg">{@html item.icon}</span>
					<span class="flex-1 text-sm text-gray-800 dark:text-dark-text">{item.label}</span>
					<svg class="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</a>
			{/each}
		</div>

		<!-- 退出登录 -->
		<button
			onclick={handleLogout}
			class="w-full mx-4 mt-4 py-3 text-sm text-red-500 bg-white dark:bg-dark-card rounded-xl btn-press"
		>
			退出登录
		</button>
	{:else}
		<!-- 未登录状态 -->
		<div class="flex flex-col items-center justify-center py-20">
			<div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center mb-4">
				<svg class="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
			</div>
			<p class="text-sm text-gray-400 mb-4">登录后享受更多功能</p>
			<div class="flex gap-3">
				<a href="/login" class="px-6 py-2 text-sm text-white bg-bilibili rounded-full btn-press">
					登录
				</a>
				<a href="/register" class="px-6 py-2 text-sm text-bilibili border border-bilibili rounded-full btn-press">
					注册
				</a>
			</div>
		</div>
	{/if}
</div>
