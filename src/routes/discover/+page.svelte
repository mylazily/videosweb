<script lang="ts">
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';

  let hotSearchWords = $state<Array<string | { keyword?: string; name?: string }>>([]);
  let tags = $state<{ slug: string; name: string }[]>([]);
  let rankVideos = $state<{ id: string | number; title: string; play_count: number }[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const { getBaseUrl } = await import('$lib/apiConfig');
    const base = getBaseUrl();

    const [searchRes, tagsRes, rankRes] = await Promise.allSettled([
      fetch(`${base}/api/v1/search/hot`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
      fetch(`${base}/api/v1/tags?limit=20`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
      fetch(`${base}/api/v1/rank/daily?limit=10`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()),
    ]);

    if (searchRes.status === 'fulfilled') {
      const d = searchRes.value;
      hotSearchWords = d.data?.list || d.data || [];
    }
    if (tagsRes.status === 'fulfilled') {
      const d = tagsRes.value;
      tags = (d.data?.list || d.data || []).slice(0, 20);
    }
    if (rankRes.status === 'fulfilled') {
      const d = rankRes.value;
      rankVideos = d.data?.list || d.data || [];
    }
    loading = false;
  });

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }
</script>

<svelte:head>
  <title>发现 - 影视</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20 space-y-4">
    {#if loading}
      <!-- 骨架屏 -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl p-3 space-y-2">
          <div class="h-4 w-16 bg-gray-200 rounded"></div>
          <div class="flex flex-wrap gap-2">
            {#each Array(8) as _}
              <div class="h-7 w-16 bg-gray-100 rounded-full"></div>
            {/each}
          </div>
        </div>
        <div class="bg-white rounded-xl p-3 space-y-2">
          <div class="h-4 w-16 bg-gray-200 rounded"></div>
          <div class="flex flex-wrap gap-2">
            {#each Array(10) as _}
              <div class="h-7 w-14 bg-gray-100 rounded-full"></div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <!-- 热门搜索 -->
      {#if hotSearchWords.length > 0}
        <section class="bg-white rounded-xl p-3">
          <h2 class="text-sm font-bold text-gray-800 mb-2">热门搜索</h2>
          <div class="flex flex-wrap gap-2">
            {#each hotSearchWords as word, i}
              <a
                href="/search?q={encodeURIComponent(typeof word === 'string' ? word : word.keyword || word.name || '')}"
                class="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600 active:bg-gray-100 transition-colors"
              >
                {#if i < 3}
                  <span class="text-xs font-bold {i === 0 ? 'text-red-500' : i === 1 ? 'text-orange-500' : 'text-yellow-500'}">{i + 1}</span>
                {:else}
                  <span class="text-xs text-gray-400">{i + 1}</span>
                {/if}
                <span>{typeof word === 'string' ? word : word.keyword || word.name || ''}</span>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 标签 -->
      {#if tags.length > 0}
        <section class="bg-white rounded-xl p-3">
          <h2 class="text-sm font-bold text-gray-800 mb-2">热门标签</h2>
          <div class="flex flex-wrap gap-2">
            {#each tags as tag}
              <a
                href="/category?tag={tag.slug}"
                class="px-3 py-1.5 bg-[#FFF0F3] text-[#FF6B9D] rounded-full text-sm active:bg-[#FFE0E8] transition-colors"
              >
                {tag.name}
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 排行榜 -->
      {#if rankVideos.length > 0}
        <section class="bg-white rounded-xl p-3">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-bold text-gray-800">今日排行</h2>
            <a href="/rank" class="text-xs text-gray-400">查看更多 ›</a>
          </div>
          <div class="space-y-1">
            {#each rankVideos as video, i}
              <a href="/v/{video.id}" class="flex items-center gap-3 py-2 active:bg-gray-50 rounded-lg px-1 transition-colors">
                <span class="w-5 text-center text-xs font-bold {i < 3 ? 'text-[#FF6B9D]' : 'text-gray-400'}">{i + 1}</span>
                <span class="flex-1 text-sm text-gray-800 truncate">{video.title}</span>
                {#if video.play_count > 0}
                  <span class="text-xs text-gray-400 flex-shrink-0">{formatCount(video.play_count)}次播放</span>
                {/if}
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- 空状态 -->
      {#if hotSearchWords.length === 0 && tags.length === 0 && rankVideos.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <p class="text-gray-400 text-sm">暂无内容</p>
        </div>
      {/if}
    {/if}
  </main>

  <NavBar />
</div>
