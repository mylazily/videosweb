<script lang="ts">
  import { page } from '$app/state';

  const navs = [
    { path: '/', label: '首页' },
    { path: '/short', label: '短视频' },
    { path: '/discover', label: '发现' },
    { path: '/category', label: '分类' },
    { path: '/profile', label: '我的' },
  ];

  const current = $derived(page.url.pathname);
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
  <div class="flex items-center h-12">
    {#each navs as nav}
      {@const isActive = nav.path === '/' ? current === '/' : current.startsWith(nav.path)}
      <a
        href={nav.path}
        class="flex-1 flex items-center justify-center h-full text-sm font-medium transition-colors duration-200 active:scale-95 {isActive ? 'text-[#FF6B9D]' : 'text-gray-400'}"
      >
        {nav.label}
      </a>
    {/each}
  </div>
</nav>

<div class="h-12"></div>
