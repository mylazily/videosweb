<script lang="ts">
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import VideoCard from '$components/VideoCard.svelte';

  type Video = {
    id: string | number;
    title: string;
    cover: string;
    play_count: number;
    rating: number;
    category?: string;
    year?: string;
  };

  let { data } = $props();
  
  let videos = $state<Video[]>(data.videos || []);
  let loading = $state(!data.loaded);
  let error = $state(false);
  let refreshing = $state(false);

  // 优化的数据加载函数
  async function loadVideos(showRefresh = false) {
    if (showRefresh) {
      refreshing = true;
    } else {
      loading = true;
    }
    error = false;

    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();

      // 使用 AbortSignal.timeout 快速失败
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${base}/api/v1/videos/hot?page=1&page_size=12`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('请求失败');
      
      const d = await response.json();
      videos = d.data?.list || d.data || [];
    } catch (e) {
      // 如果有缓存数据，不清空
      if (videos.length === 0) {
        error = true;
      }
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  // 下拉刷新处理
  async function handleRefresh() {
    await loadVideos(true);
  }

  // 重试处理
  function handleRetry() {
    loadVideos();
  }

  onMount(() => {
    if (!data.loaded) {
      loadVideos();
    }
  });
</script>

<svelte:head>
  <title>影视库 - 高清影视在线观看 | 热门电影电视剧</title>
  <meta name="description" content="影视库提供高清电影、电视剧、综艺、动漫在线观看，极速加载，无广告打扰，支持PWA离线观看" />
  <meta name="keywords" content="影视,电影,电视剧,在线观看,高清视频,免费影视" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="影视库 - 高清影视在线观看" />
  <meta property="og:description" content="高清电影、电视剧、综艺、动漫在线观看，极速加载，无广告打扰" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://shipinku.pages.dev" />
  <meta property="og:image" content="https://shipinku.pages.dev/icons/icon-512.png" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="影视库 - 高清影视在线观看" />
  <meta name="twitter:description" content="高清电影、电视剧在线观看" />
  
  <!-- 预连接 -->
  <link rel="preconnect" href="https://9901.555554.xyz" />
  <link rel="dns-prefetch" href="https://9901.555554.xyz" />
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="/icons/icon-192.png" as="image" />
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20">
    <!-- 下拉刷新指示器 -->
    {#if refreshing}
      <div class="flex items-center justify-center py-3 mb-2">
        <div class="w-5 h-5 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-2 text-sm text-gray-500">刷新中...</span>
      </div>
    {/if}

    {#if loading}
      <!-- 优化的骨架屏 -->
      <div class="grid grid-cols-2 gap-3">
        {#each Array(6) as _, i}
          <div 
            class="bg-white rounded-xl overflow-hidden shadow-sm" 
            style="animation: skeletonFade 0.4s ease-out {i * 50}ms both;"
          >
            <div class="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              <div class="absolute inset-0 shimmer"></div>
            </div>
            <div class="p-2.5 space-y-2">
              <div class="h-3 bg-gray-100 rounded shimmer"></div>
              <div class="h-2 w-2/3 bg-gray-50 rounded shimmer"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if error}
      <!-- 错误状态 - 带重试 -->
      <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
        <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p class="text-gray-500 text-sm mb-4">加载失败，请检查网络</p>
        <button 
          onclick={handleRetry}
          class="px-4 py-2 bg-[#FF6B9D] text-white text-sm rounded-full active:scale-95 transition-transform"
        >
          重新加载
        </button>
      </div>
    {:else if videos.length === 0}
      <!-- 空状态 -->
      <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm">暂无内容</p>
      </div>
    {:else}
      <!-- 视频列表 -->
      <div class="grid grid-cols-2 gap-3">
        {#each videos as video, i (video.id)}
          <div style="animation: cardFade 0.35s ease-out {i * 40}ms both;">
            <VideoCard {video} />
          </div>
        {/each}
      </div>
      
      <!-- 加载更多提示（可选） -->
      <div class="flex items-center justify-center py-6 text-gray-400 text-xs">
        <span>已加载 {videos.length} 部影视</span>
      </div>
    {/if}
  </main>

  <NavBar />
</div>

<style>
  /* 优化的动画 */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes skeletonFade {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes cardFade {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  /* 骨架屏闪烁效果 */
  .shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* 旋转动画 */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 0.8s linear infinite;
  }
</style>
