<script lang="ts">
  import { page } from '$app/state';

  const navs = [
    { path: '/', label: '首页', icon: 'home' },
    { path: '/short', label: '短视频', icon: 'video' },
    { path: '/discover', label: '发现', icon: 'compass' },
    { path: '/category', label: '分类', icon: 'grid' },
    { path: '/profile', label: '我的', icon: 'user' },
  ] as const;

  const current = $derived(page.url.pathname);
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100/80 safe-bottom">
  <div class="flex items-center h-14 max-w-lg mx-auto">
    {#each navs as nav}
      {@const isActive = nav.path === '/' ? current === '/' : current.startsWith(nav.path)}
      <a
        href={nav.path}
        class="flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors duration-200 {isActive ? 'text-[#FB7299]' : 'text-gray-500'}"
      >
        <!-- 图标 -->
        {#if nav.icon === 'home'}
          <svg class="w-5 h-5" fill="{isActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        {:else if nav.icon === 'video'}
          <svg class="w-5 h-5" fill="{isActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        {:else if nav.icon === 'compass'}
          <svg class="w-5 h-5" fill="{isActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        {:else if nav.icon === 'grid'}
          <svg class="w-5 h-5" fill="{isActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
        {:else if nav.icon === 'user'}
          <svg class="w-5 h-5" fill="{isActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        {/if}
        <!-- 文字 -->
        <span class="text-[10px] font-medium">{nav.label}</span>
      </a>
    {/each}
  </div>
</nav>

<!-- 占位 -->
<div class="h-14"></div>
