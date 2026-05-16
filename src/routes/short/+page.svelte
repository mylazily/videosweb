<script lang="ts">
  /**
   * 短视频专区页面
   * 统一风格：与首页一致的视觉体验
   */
  import type { ShortVideo } from '$lib/types';
  import { formatPlayCount, formatDuration } from '$lib/utils';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import { onMount } from 'svelte';

  let { data } = $props();

  // 数据状态
  let shorts = $state<ShortVideo[]>(data.shorts || []);
  let activeSort = $state(data.sort || 'popular');
  let loading = $state(false);
  let hasMore = $state(data.hasMore);
  let pageNum = $state(data.page || 1);
  let refreshing = $state(false);
  let error = $state(false);

  // 排序选项
  const sortOptions = [
    { value: 'popular', label: '推荐' },
    { value: 'latest', label: '最新' },
    { value: 'random', label: '热门' },
  ];

  // 切换排序
  function handleSortChange(sort: string) {
    activeSort = sort;
    pageNum = 1;
    hasMore = true;
    loadShorts(true);
  }

  // 加载短视频列表
  async function loadShorts(reset = false) {
    if (loading) return;
    loading = true;
    error = false;

    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const params = new URLSearchParams({
        sort: activeSort,
        page: String(pageNum),
        page_size: '10'
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${base}/api/v1/shorts?${params}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const resData = await res.json();
      const newShorts = resData.data?.list || resData.data || [];
      
      if (reset) {
        shorts = newShorts;
      } else {
        shorts = [...shorts, ...newShorts];
      }
      hasMore = newShorts.length >= 10;
    } catch {
      if (shorts.length === 0) error = true;
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  // 加载更多
  async function loadMore() {
    if (!hasMore || loading) return;
    pageNum++;
    await loadShorts();
  }

  // 下拉刷新
  async function handleRefresh() {
    refreshing = true;
    pageNum = 1;
    hasMore = true;
    await loadShorts(true);
  }

  // 重试
  function handleRetry() {
    loadShorts(true);
  }

  // IntersectionObserver 实现无限滚动
  let sentinel: HTMLElement;

  onMount(() => {
    if (!data.shorts?.length) loadShorts();
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  });
</script>

<svelte:head>
  <title>短视频 - 影视库</title>
  <meta name="description" content="精彩短视频推荐，高清无广告" />
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="pt-3 pb-20">
    <!-- 下拉刷新指示器 -->
    {#if refreshing}
      <div class="flex items-center justify-center py-3 mb-2">
        <div class="w-5 h-5 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-2 text-sm text-gray-500">刷新中...</span>
      </div>
    {/if}

    <!-- 顶部排序标签 -->
    <div class="px-3 pb-2">
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        {#each sortOptions as option}
          <button
            onclick={() => handleSortChange(option.value)}
            class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all duration-200 active:scale-95"
            class:bg-[#FF6B9D]={activeSort === option.value}
            class:text-white={activeSort === option.value}
            class:bg-gray-100={activeSort !== option.value}
            class:text-gray-600={activeSort !== option.value}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="px-3 mt-2">
      {#if loading && shorts.length === 0}
        <!-- 骨架屏 -->
        <div class="grid grid-cols-2 gap-3">
          {#each Array(6) as _, i}
            <div 
              class="bg-white rounded-xl overflow-hidden shadow-sm"
              style="animation: fadeIn 0.4s ease-out {i * 50}ms both;"
            >
              <div class="relative aspect-[9/16] bg-gray-100 overflow-hidden">
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
        <!-- 错误状态 -->
        <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
          <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-gray-500 text-sm mb-4">加载失败</p>
          <button 
            onclick={handleRetry}
            class="px-4 py-2 bg-[#FF6B9D] text-white text-sm rounded-full active:scale-95 transition-transform"
          >
            重新加载
          </button>
        </div>
      {:else if shorts.length === 0}
        <!-- 空状态 -->
        <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <p class="text-gray-400 text-sm">暂无短视频</p>
        </div>
      {:else}
        <!-- 短视频列表 -->
        <div class="grid grid-cols-2 gap-3">
          {#each shorts as short, i (short.id)}
            <a 
              href="/short/{short.id}" 
              class="block bg-white rounded-xl overflow-hidden shadow-sm press"
              style="animation: cardFade 0.35s ease-out {i * 40}ms both;"
            >
              <!-- 封面 -->
              <div class="relative aspect-[9/16] bg-gray-100">
                <img
                  src={short.cover}
                  alt={short.title}
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  class="w-full h-full object-cover"
                />
                <!-- 时长 -->
                <span class="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] text-white bg-black/70 rounded">
                  {formatDuration(short.duration)}
                </span>
                <!-- 播放量 -->
                <span class="absolute bottom-2 left-2 px-1.5 py-0.5 text-[10px] text-white bg-black/70 rounded flex items-center gap-0.5">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  {formatPlayCount(short.play_count)}
                </span>
              </div>
              <!-- 标题 -->
              <div class="p-2.5">
                <h3 class="text-xs font-medium line-clamp-2 text-gray-800 leading-tight">
                  {short.title}
                </h3>
                <div class="flex items-center gap-1.5 mt-1.5">
                  <img
                    src={short.author.avatar}
                    alt={short.author.username}
                    class="w-4 h-4 rounded-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                  <span class="text-[10px] text-gray-400 truncate">{short.author.username}</span>
                </div>
              </div>
            </a>
          {/each}
        </div>

        <!-- 无限滚动 -->
        {#if hasMore}
          <div bind:this={sentinel} class="flex items-center justify-center py-4">
            {#if loading}
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-[#FF6B9D]/30 border-t-[#FF6B9D] rounded-full animate-spin"></div>
                <span class="text-xs text-gray-400">加载中...</span>
              </div>
            {:else}
              <span class="text-xs text-gray-400">上拉加载更多</span>
            {/if}
          </div>
        {:else}
          <div class="flex items-center justify-center py-4">
            <span class="text-xs text-gray-400">已经到底了</span>
          </div>
        {/if}
      {/if}
    </div>
  </main>

  <NavBar />
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes cardFade {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .animate-spin {
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  .press:active {
    transform: scale(0.97);
    transition: transform 0.1s ease-out;
  }
</style>
