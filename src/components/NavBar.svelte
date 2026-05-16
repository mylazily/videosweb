<script lang="ts">
  import { page } from '$app/state';

  const navs = [
    { path: '/', label: '首页', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/short', label: '短视频', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { path: '/category', label: '分类', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { path: '/rank', label: '排行', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { path: '/profile', label: '我的', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const current = $derived(page.url.pathname);
</script>

<nav 
  class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[var(--divider)]"
  style="padding-bottom: var(--safe-bottom);"
>
  <div class="flex items-center justify-around h-14">
    {#each navs as nav}
      {@const isActive = nav.path === '/' ? current === '/' : current.startsWith(nav.path)}
      <a
        href={nav.path}
        class="flex flex-col items-center justify-center flex-1 h-full press transition-colors duration-200 {isActive ? 'text-[#FF6B9D]' : 'text-[var(--text-tertiary)]'}"
      >
        <div class="relative">
          <svg 
            class="w-6 h-6 transition-transform duration-200" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor"
            stroke-width={isActive ? 2 : 1.5}
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d={nav.icon} />
          </svg>
          {#if nav.path === '/profile'}
            <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF4D4F] rounded-full"></span>
          {/if}
        </div>
        <span class="text-[10px] mt-0.5 font-medium">{nav.label}</span>
      </a>
    {/each}
  </div>
</nav>

<!-- 占位 -->
<div class="h-14" style="margin-bottom: var(--safe-bottom);"></div>
