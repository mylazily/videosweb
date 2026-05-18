<script lang="ts">
  /**
   * 搜索页
   * 统一风格
   */
  import type { Video } from '$lib/types';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import VideoCard from '$components/VideoCard.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  let hotWords = $state<string[]>([]);
  let searchResults = $state<Video[]>([]);
  let keyword = $state(page.url.searchParams.get('q') || '');
  let loading = $state(false);
  let hasSearched = $state(!!keyword);
  let hotWordsLoading = $state(true);

  // 加载热搜词
  async function loadHotWords() {
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/search/hot`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        hotWords = data.data?.list || data.data || [];
      }
    } catch {
      hotWords = [];
    } finally {
      hotWordsLoading = false;
    }
  }

  // 执行搜索
  async function handleSearch(kw?: string) {
    const searchKw = kw || keyword;
    if (!searchKw.trim()) return;
    keyword = searchKw;
    loading = true;
    hasSearched = true;

    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(keyword)}&page=1&page_size=20`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        searchResults = data.data?.list || data.data || [];
      }
    } catch {
      searchResults = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadHotWords();
    if (keyword) handleSearch();
  });
</script>

<svelte:head>
  <title>{keyword ? `${keyword} - 搜索结果` : '搜索 - 影视库'}</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20">
    {#if !hasSearched}
      <!-- 热搜榜 -->
      <h2 class="text-base font-bold text-gray-800 mb-3">🔥 热搜榜</h2>
      
      {#if hotWordsLoading}
        <div class="bg-white rounded-xl p-3 space-y-2">
          {#each Array(10) as _}
            <div class="flex items-center gap-3 py-2">
              <div class="w-5 h-5 rounded bg-gray-200"></div>
              <div class="flex-1 h-4 bg-gray-100 rounded"></div>
            </div>
          {/each}
        </div>
      {:else if hotWords.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <p class="text-gray-400 text-sm">暂无热搜数据</p>
        </div>
      {:else}
        <div class="bg-white rounded-xl p-3">
          <div class="grid grid-cols-2 gap-2">
            {#each hotWords as word, i}
              {@const text = typeof word === 'string' ? word : word.keyword || word.word || word.name || ''}
              <button
                onclick={() => handleSearch(text)}
                class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <span class="w-5 h-5 flex items-center justify-center rounded text-xs font-bold {i < 3 ? 'bg-[#FF6B9D] text-white' : 'bg-gray-200 text-gray-500'}">
                  {i + 1}
                </span>
                <span class="flex-1 text-sm text-gray-800 truncate">{text}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- 搜索结果 -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-bold text-gray-800">搜索结果</h2>
        <button onclick={() => { hasSearched = false; keyword = ''; }} class="text-xs text-gray-400">
          返回热搜
        </button>
      </div>

      {#if loading}
        <div class="grid grid-cols-2 gap-3">
          {#each Array(6) as _, i}
            <div class="bg-white rounded-xl overflow-hidden shadow-sm" style="animation: fadeIn 0.4s ease-out {i * 50}ms both;">
              <div class="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <div class="absolute inset-0 shimmer"></div>
              </div>
              <div class="p-2.5 space-y-2">
                <div class="h-3 bg-gray-100 rounded shimmer"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if searchResults.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <p class="text-gray-500 text-sm">未找到"{keyword}"相关内容</p>
        </div>
      {:else}
        <p class="text-xs text-gray-400 mb-3">找到 {searchResults.length} 个结果</p>
        <div class="grid grid-cols-2 gap-3">
          {#each searchResults as video, i (video.id)}
            <div style="animation: cardFade 0.35s ease-out {i * 40}ms both;">
              <VideoCard {video} />
            </div>
          {/each}
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
</style>
