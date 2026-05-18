<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getToken, getUserInfo } from '$lib/auth';

  let searchQuery = $state('');
  let focused = $state(false);

  const currentPath = $derived(page.url.pathname);
  const isHome = $derived(currentPath === '/');
  const isLoggedIn = $derived(!!getToken());
  const user = $derived(getUserInfo<{ username: string }>());

  const pageTitles: Record<string, string> = {
    '/search': '搜索',
    '/discover': '发现',
    '/category': '分类',
    '/rank': '排行榜',
    '/history': '历史',
    '/profile': '我的',
    '/login': '登录',
    '/register': '注册',
    '/short': '短视频'
  };

  const title = $derived(
    pageTitles[currentPath] ||
    (currentPath.startsWith('/v/') ? '详情' : '')
  );

  function handleSearch() {
    if (searchQuery.trim()) {
      goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }
</script>

{#if isHome}
  <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
    <div class="flex items-center h-11 px-3 gap-2">
      <div class="flex-1 flex items-center h-8 px-3 bg-gray-100 rounded-lg transition-all {focused ? 'ring-2 ring-pink-300 bg-white' : ''}">
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          bind:value={searchQuery}
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          onfocus={() => focused = true}
          onblur={() => focused = false}
          type="text"
          placeholder="搜索"
          autocomplete="off"
          class="flex-1 ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
      </div>

      {#if isLoggedIn && user}
        <a href="/profile" class="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </a>
      {:else}
        <a href="/login" class="px-3 py-1.5 text-xs text-pink-500 flex-shrink-0">登录</a>
      {/if}
    </div>
  </header>
{:else}
  <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
    <div class="flex items-center h-11 px-3">
      <button onclick={() => window.history.back()} class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors" aria-label="返回">
        <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="flex-1 text-center text-sm font-medium text-gray-800 truncate px-4">{title}</h1>
      <div class="w-8 h-8"></div>
    </div>
  </header>
{/if}

<div class="h-11"></div>
