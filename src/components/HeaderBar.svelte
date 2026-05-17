<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getToken, getUserInfo } from '$lib/auth';

  let searchQuery = $state('');
  let inputEl = $state<HTMLInputElement>();
  let focused = $state(false);

  const currentPath = $derived(page.url.pathname);
  const isHome = $derived(currentPath === '/');
  const isLoggedIn = $derived(!!getToken());
  const user = $derived(getUserInfo<{ username: string; avatar?: string }>());

  // 页面标题映射
  const pageTitles: Record<string, string> = {
    '/search': '搜索',
    '/discover': '发现',
    '/category': '分类',
    '/rank': '排行榜',
    '/history': '观看历史',
    '/profile': '个人中心',
    '/login': '登录',
    '/register': '注册',
    '/short': '短视频'
  };

  const title = $derived(
    pageTitles[currentPath] ||
    (currentPath.startsWith('/v/') ? '视频详情' :
     currentPath.startsWith('/video/') ? '视频详情' :
     currentPath.startsWith('/category/') ? '分类' :
     currentPath.startsWith('/tags/') ? '标签' :
     currentPath.startsWith('/short/') ? '短视频' : '')
  );

  function handleSearch() {
    if (searchQuery.trim()) {
      goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto('/');
    }
  }
</script>

{#if isHome}
  <!-- 首页：Logo + 搜索框 + 用户 -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80">
    <div class="flex items-center h-12 px-3 gap-3">
      <!-- Logo -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FB7299] to-[#FF9CB3] flex items-center justify-center">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span class="text-sm font-bold text-gray-800 hidden sm:block">影视库</span>
      </div>

      <!-- 搜索框 -->
      <div 
        class="flex-1 flex items-center h-8 px-3 bg-gray-100 rounded-full transition-all duration-200 {focused ? 'ring-2 ring-[#FB7299]/30 bg-gray-50' : ''}"
      >
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          bind:this={inputEl}
          bind:value={searchQuery}
          onkeydown={handleKeyDown}
          onfocus={() => focused = true}
          onblur={() => focused = false}
          type="text"
          placeholder="搜索视频、UP主"
          autocomplete="off"
          class="flex-1 ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
      </div>

      <!-- 用户 -->
      <div class="flex-shrink-0">
        {#if isLoggedIn && user}
          <a href="/profile" class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#FB7299] to-[#FF9CB3] flex items-center justify-center text-white text-xs font-bold">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </a>
        {:else}
          <a href="/login" class="px-3 py-1.5 text-xs text-[#FB7299] border border-[#FB7299]/30 rounded-full hover:bg-[#FB7299]/5 transition-colors">
            登录
          </a>
        {/if}
      </div>
    </div>
  </header>
{:else}
  <!-- 其他页面：返回 + 标题 -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80">
    <div class="flex items-center h-12 px-3">
      <!-- 返回按钮 -->
      <button onclick={goBack} class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
        <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- 标题 -->
      <h1 class="flex-1 text-center text-sm font-medium text-gray-800 truncate px-4">
        {title}
      </h1>

      <!-- 右侧操作区（占位） -->
      <div class="w-8 h-8"></div>
    </div>
  </header>
{/if}

<!-- 占位 -->
<div class="h-12"></div>
