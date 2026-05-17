<script lang="ts">
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import VideoCard from '$components/VideoCard.svelte';

  type Video = {
    id: string | number;
    title: string;
    cover: string;
    play_count?: number;
    like_count?: number;
    danmaku_count?: number;
    duration?: number;
    author?: string;
    category?: string;
  };

  const categories = [
    { slug: '', name: '推荐' },
    { slug: 'hot', name: '热门' },
    { slug: 'movie', name: '电影' },
    { slug: 'tv', name: '电视剧' },
    { slug: 'anime', name: '动漫' },
    { slug: 'variety', name: '综艺' },
  ];

  let activeCategory = $state('');
  let videos = $state<Video[]>([]);
  let loading = $state(true);
  let refreshing = $state(false);

  onMount(async () => {
    await loadVideos();
  });

  async function loadVideos() {
    loading = true;
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();

      const endpoint = activeCategory === '' 
        ? '/api/v1/videos/hot?page=1&page_size=12'
        : activeCategory === 'hot'
        ? '/api/v1/videos/hot?page=1&page_size=12'
        : `/api/v1/categories/${activeCategory}/videos?page=1&page_size=12`;

      const res = await fetch(`${base}${endpoint}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        videos = data.data?.list || data.data || [];
      }
    } catch {
      // 加载失败
    } finally {
      loading = false;
    }
  }

  async function handleCategoryChange(slug: string) {
    if (activeCategory === slug) return;
    activeCategory = slug;
    await loadVideos();
  }

  async function handleRefresh() {
    if (refreshing) return;
    refreshing = true;
    await loadVideos();
    refreshing = false;
  }
</script>

<svelte:head>
  <title>影视库 - 高清影视在线观看</title>
  <link rel="preconnect" href="https://9901.555554.xyz" />
</svelte:head>

<div class="min-h-screen bg-[#F5F5F5]">
  <HeaderBar />

  <!-- 分类标签 -->
  <div class="sticky top-12 z-40 bg-white border-b border-gray-100">
    <div class="flex items-center px-3 h-10 overflow-x-auto no-scrollbar">
      {#each categories as cat}
        <button
          onclick={() => handleCategoryChange(cat.slug)}
          class="flex-shrink-0 px-3 py-1 text-sm rounded-full transition-all duration-200 {activeCategory === cat.slug ? 'bg-[#FB7299] text-white' : 'text-gray-600 hover:bg-gray-100'}"
        >
          {cat.name}
        </button>
      {/each}
    </div>
  </div>

  <main class="px-3 pt-3 pb-16">
    {#if loading}
      <!-- 骨架屏 -->
      <div class="grid grid-cols-2 gap-3">
        {#each Array(6) as _, i}
          <div class="bg-white rounded-xl overflow-hidden" style="animation: fadeIn 0.3s ease-out {i * 50}ms both;">
            <div class="aspect-video bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
            <div class="p-2.5 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if videos.length === 0}
      <!-- 空状态 -->
      <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
        <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm mb-4">暂无内容</p>
        <button onclick={handleRefresh} class="px-4 py-2 text-sm text-[#FB7299] border border-[#FB7299]/30 rounded-full hover:bg-[#FB7299]/5 transition-colors">
          刷新试试
        </button>
      </div>
    {:else}
      <!-- 视频列表 -->
      <div class="grid grid-cols-2 gap-3">
        {#each videos as video, i (video.id)}
          <div style="animation: fadeIn 0.4s ease-out {i * 60}ms both;">
            <VideoCard {video} />
          </div>
        {/each}
      </div>

      <!-- 加载更多提示 -->
      <div class="flex items-center justify-center py-6 text-xs text-gray-400">
        <span>上滑加载更多</span>
      </div>
    {/if}
  </main>

  <NavBar />
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
