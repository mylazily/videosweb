<script lang="ts">
  /**
   * 排行榜页
   * 统一风格
   */
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';

  interface RankItem {
    id: string | number;
    title: string;
    play_count: number;
    cover?: string;
    rating?: number;
  }

  let rankItems = $state<RankItem[]>([]);
  let loading = $state(true);
  let error = $state(false);

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  onMount(async () => {
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/rank/daily?page_size=30`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        rankItems = data.data?.list || data.data || [];
      }
    } catch {
      error = true;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>排行榜 - 影视库</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20">
    <h1 class="text-base font-bold text-gray-800 mb-3">🏆 热门排行榜</h1>

    {#if loading}
      <!-- 骨架屏 -->
      <div class="bg-white rounded-xl p-3 space-y-2">
        {#each Array(10) as _}
          <div class="flex items-center gap-3 py-2">
            <div class="w-5 h-5 rounded bg-gray-200"></div>
            <div class="flex-1 h-4 bg-gray-100 rounded"></div>
            <div class="w-16 h-3 bg-gray-100 rounded"></div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center py-20">
        <p class="text-gray-500 text-sm">加载失败</p>
      </div>
    {:else if rankItems.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <p class="text-gray-400 text-sm">暂无排行数据</p>
      </div>
    {:else}
      <div class="bg-white rounded-xl p-3">
        <div class="space-y-1">
          {#each rankItems as video, i}
            <a 
              href="/v/{video.id}" 
              class="flex items-center gap-3 py-2.5 px-1 rounded-lg active:bg-gray-50 transition-colors"
            >
              <span class="w-6 text-center text-sm font-bold {i < 3 ? 'text-[#FF6B9D]' : 'text-gray-400'}">
                {i + 1}
              </span>
              <span class="flex-1 text-sm text-gray-800 truncate">{video.title}</span>
              {#if video.play_count > 0}
                <span class="text-xs text-gray-400 flex-shrink-0">{formatCount(video.play_count)}次</span>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </main>

  <NavBar />
</div>
