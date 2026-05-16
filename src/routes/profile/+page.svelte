<script lang="ts">
  /**
   * 个人中心页
   * 统一风格：与首页一致的视觉体验
   */
  import { isLoggedIn, getUserInfo, clearTokens } from '$lib/auth';
  import type { User } from '$lib/types';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';

  let { data } = $props();

  let user = $state<User | null>(data.user || null);
  let loggedIn = $state(isLoggedIn());

  // 功能菜单
  const menuItems = [
    { icon: 'history', label: '观看历史', path: '/history' },
    { icon: 'heart', label: '我的收藏', path: '/profile' },
    { icon: 'message', label: '我的评论', path: '/profile' },
    { icon: 'bell', label: '消息通知', path: '/profile' },
    { icon: 'feedback', label: '意见反馈', path: '/profile' },
    { icon: 'settings', label: '设置', path: '/profile' }
  ];

  // 图标 SVG paths
  const iconPaths: Record<string, string> = {
    history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    message: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.034L3 20l1.034-3.745A9.863 9.863 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    feedback: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.086c1.22-.66 2.791.39 2.28 1.614-.425 1.756.682 3.474 1.938 4.028a1.724 1.724 0 00-1.086 2.573c.66 1.22-.39 2.791-1.614 2.28-1.756-.425-3.474.682-4.028 1.938a1.724 1.724 0 00-2.573-1.086c-1.22.66-2.791-.39-2.28-1.614.425-1.756-.682-3.474-1.938-4.028a1.724 1.724 0 001.086-2.573c-.66-1.22.39-2.791 1.614-2.28.756.425 1.756-.682 1.938-1.938zM12 15a3 3 0 100-6 3 3 0 000 6z'
  };

  // 退出登录
  function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
      clearTokens();
      loggedIn = false;
      user = null;
    }
  }
</script>

<svelte:head>
  <title>我 - 影视库</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="pt-3 pb-20">
    {#if loggedIn && user}
      <!-- 用户信息卡片 -->
      <div class="mx-3 p-4 rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] text-white shadow-lg">
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
      <div class="mx-3 mt-4 bg-white rounded-xl overflow-hidden shadow-sm">
        {#each menuItems as item, i}
          <a
            href={item.path}
            class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 active:scale-[0.98] transition-transform"
          >
            <div class="w-8 h-8 rounded-lg bg-[#FF6B9D]/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-[#FF6B9D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d={iconPaths[item.icon]}/>
              </svg>
            </div>
            <span class="flex-1 text-sm text-gray-800">{item.label}</span>
            <svg class="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
        {/each}
      </div>

      <!-- 退出登录 -->
      <button
        onclick={handleLogout}
        class="w-full mx-3 mt-4 py-3 text-sm text-red-500 bg-white rounded-xl shadow-sm active:scale-[0.98] transition-transform"
      >
        退出登录
      </button>
    {:else}
      <!-- 未登录状态 -->
      <div class="flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <p class="text-sm text-gray-400 mb-4">登录后享受更多功能</p>
        <div class="flex gap-3">
          <a href="/login" class="px-6 py-2 text-sm text-white bg-[#FF6B9D] rounded-full active:scale-95 transition-transform">
            登录
          </a>
          <a href="/register" class="px-6 py-2 text-sm text-[#FF6B9D] border border-[#FF6B9D] rounded-full active:scale-95 transition-transform">
            注册
          </a>
        </div>
      </div>
    {/if}
  </main>

  <NavBar />
</div>
