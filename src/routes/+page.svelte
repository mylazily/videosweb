<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import VideoCard from '$components/VideoCard.svelte';
  import type { Video } from '$lib/types';

  let videos = $state<Video[]>([]);
  let loading = $state(false);
  let hasMore = $state(true);
  let page = $state(1);
  let error = $state('');

  // 无限滚动观察器
  let sentinelEl: HTMLDivElement;
  let observer: IntersectionObserver;

  onMount(() => {
    loadVideos(1);
    setupInfiniteScroll();
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });

  function setupInfiniteScroll() {
    if (!sentinelEl) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          loadVideos(page + 1);
        }
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(sentinelEl);
  }

  async function loadVideos(targetPage: number) {
    if (loading) return;
    loading = true;
    error = '';

    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(
        `${base}/api/v1/videos/hot?page=${targetPage}&page_size=12`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!res.ok) throw new Error('加载失败');

      const data = await res.json();
      const list = data.data?.list || data.data || [];

      if (targetPage === 1) {
        videos = list;
      } else {
        videos = [...videos, ...list];
      }

      page = targetPage;
      hasMore = list.length === 12;
    } catch (e) {
      error = targetPage === 1 ? '加载失败，请重试' : '';
    } finally {
      loading = false;
    }
  }

  function retry() {
    loadVideos(1);
  }
</script>

<svelte:head>
  <title>影视库</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <HeaderBar />

  <main class="px-2 pt-2 pb-4">
    {#if videos.length === 0 && !loading && error}
      <!-- 错误状态 -->
      <div class="flex flex-col items-center justify-center py-24">
        <div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm mb-4">{error}</p>
        <button onclick={retry} class="px-4 py-2 text-sm text-pink-500 border border-pink-500 rounded-full active:bg-pink-50">
          重试
        </button>
      </div>
    {:else}
      <!-- 视频网格 -->
      <div class="grid grid-cols-2 gap-2">
        {#each videos as video, i (video.id)}
          <div style="animation: fadeIn 0.3s ease-out {Math.min(i % 12, 6) * 50}ms both;">
            <VideoCard {video} />
          </div>
        {/each}

        <!-- 骨架屏（加载中） -->
        {#if loading}
          {#each Array(4) as _, i}
            <div class="bg-white rounded-lg overflow-hidden" style="animation: pulse 0.6s ease-in-out infinite; animation-delay: {i * 100}ms;">
              <div class="aspect-video bg-gray-200"></div>
              <div class="p-2 space-y-1.5">
                <div class="h-3.5 bg-gray-200 rounded w-4/5"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- 无限滚动哨兵 -->
      {#if videos.length > 0}
        <div bind:this={sentinelEl} class="h-4 mt-4 flex items-center justify-center">
          {#if loading && page > 1}
            <div class="w-5 h-5 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          {:else if !hasMore}
            <span class="text-xs text-gray-400">没有更多了</span>
          {/if}
        </div>
      {/if}
    {/if}
  </main>

  <NavBar />
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
