<script lang="ts">
  import { page } from '$app/state';

  const navs = [
    { path: '/', label: '首页', icon: 'home' },
    { path: '/short', label: '短视频', icon: 'video' },
    { path: '/discover', label: '发现', icon: 'compass' },
    { path: '/category', label: '分类', icon: 'grid' },
    { path: '/profile', label: '我的', icon: 'user' },
  ];

  const current = $derived(page.url.pathname);

  // 图标 SVG
  const icons: Record<string, string> = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    compass: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7',
    grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  };
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100/80 safe-bottom">
  <div class="flex items-center h-14 max-w-md mx-auto px-2">
    {#each navs as nav}
      {@const isActive = nav.path === '/' ? current === '/' : current.startsWith(nav.path)}
      <a
        href={nav.path}
        class="flex-1 flex flex-col items-center justify-center h-full py-1 transition-all duration-200 press {isActive ? 'text-[#FF6B9D]' : 'text-gray-400'}"
      >
        <svg 
          class="w-5 h-5 mb-0.5 transition-transform duration-200 {isActive ? 'scale-110' : ''}" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d={icons[nav.icon]}/>
        </svg>
        <span class="text-[10px] font-medium">{nav.label}</span>
        <!-- 活跃指示器 -->
        {#if isActive}
          <div class="absolute -top-0.5 w-4 h-0.5 bg-[#FF6B9D] rounded-full"></div>
        {/if}
      </a>
    {/each}
  </div>
</nav>

<!-- 占位 -->
<div class="h-14"></div>

<style>
  .press:active {
    transform: scale(0.9);
    transition: transform 0.1s ease-out;
  }
</style>
