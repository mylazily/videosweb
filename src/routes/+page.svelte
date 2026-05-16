<script lang="ts">
  import { onMount } from 'svelte';
  import type { Video } from '$lib/types';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import CategoryTabs from '$components/CategoryTabs.svelte';
  import VideoCard from '$components/VideoCard.svelte';
  import { getBaseUrl } from '$lib/apiConfig';

  // 状态
  let videos = $state<Video[]>([]);
  let loading = $state(true);
  let hasMore = $state(true);
  let pageNum = $state(1);

  // 骨架屏数据（静态，立即显示）
  const skeletons = Array(8).fill(null);

  async function loadVideos() {
    try {
      const base = getBaseUrl();
      const [hot, latest] = await Promise.all([
        fetch(`${base}/api/v1/videos/hot?page=1&page_size=12`, { signal: AbortSignal.timeout(3000) }),
        fetch(`${base}/api/v1/videos/latest?page=1&page_size=12`, { signal: AbortSignal.timeout(3000) })
      ]);

      const list: Video[] = [];
      for (const res of [hot, latest]) {
        if (res.ok) {
          const data = await res.json();
          list.push(...(data.data?.list || data.data || []));
        }
      }
      videos = list;
    } catch {
      // 静默失败
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadVideos();
  });

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    pageNum++;
    
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/videos/hot?page=${pageNum}&page_size=10`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const list: Video[] = data.data?.list || data.data || [];
        if (list.length) videos = [...videos, ...list];
        else hasMore = false;
      }
    } catch {
      hasMore = false;
    } finally {
      loading = false;
    }
  }

  function onCategorySelect(slug: string) {
    if (slug) window.location.href = `/category/${slug}`;
  }
</script>

<svelte:head>
  <title>影视 - 高清在线观看</title>
  <meta name="description" content="海量高清影视资源，电影电视剧动漫综艺在线观看" />
  <link rel="preconnect" href="https://9901.555554.xyz" />
</svelte:head>

<div class="min-h-screen bg-[var(--bg)]">
  <HeaderBar />
  <CategoryTabs onSelect={onCategorySelect} />

  <main class="px-3 pt-3 pb-4">
    {#if loading && videos.length === 0}
      <!-- 骨架屏 -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-4">
        {#each skeletons as _, i}
          <div class="animate-fade-in" style="animation-delay: {i * 40}ms;">
            <div class="aspect-[3/4] rounded-xl skeleton"></div>
            <div class="mt-2 space-y-2">
              <div class="h-4 skeleton w-full"></div>
              <div class="h-3 skeleton w-2/3"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if videos.length === 0}
      <!-- 空状态 -->
      <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div class="w-20 h-20 rounded-2xl bg-[var(--divider)] flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="text-[var(--text-secondary)] mb-4">暂无内容</p>
        <button 
          onclick={() => { loading = true; loadVideos(); }}
          class="px-6 py-2.5 bg-[#FF6B9D] text-white text-sm font-medium rounded-full press shadow-lg shadow-[#FF6B9D]/30"
        >
          重新加载
        </button>
      </div>
    {:else}
      <!-- 视频网格 -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-4">
        {#each videos as video, i (video.id)}
          <VideoCard {video} index={i} />
        {/each}
      </div>

      <!-- 加载更多 -->
      {#if hasMore}
        <div class="flex justify-center mt-6">
          {#if loading}
            <div class="flex items-center gap-2 text-[var(--text-tertiary)]">
              <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" class="opacity-20"/>
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="text-sm">加载中...</span>
            </div>
          {:else}
            <button 
              onclick={loadMore}
              class="px-6 py-2.5 bg-white text-[var(--text-secondary)] text-sm font-medium rounded-full press shadow-sm border border-[var(--border)]"
            >
              加载更多
            </button>
          {/if}
        </div>
      {:else}
        <div class="text-center mt-6">
          <span class="text-xs text-[var(--text-tertiary)]">— 已经到底啦 —</span>
        </div>
      {/if}
    {/if}
  </main>

  <NavBar />
</div>
