<script lang="ts">
  /**
   * 观看历史页
   * 统一风格
   */
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';

  interface WatchHistory {
    id: string;
    video_id: string;
    video_title: string;
    video_cover: string;
    episode_name?: string;
    progress: number;
    duration: number;
    watch_time: string;
  }

  let history = $state<WatchHistory[]>([]);
  let loading = $state(true);

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function getProgressPercent(progress: number, duration: number): number {
    if (duration <= 0) return 0;
    return Math.min((progress / duration) * 100, 100);
  }

  async function handleDelete(id: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    history = history.filter((h) => h.id !== id);
  }

  async function handleClearAll() {
    if (confirm('确定要清空所有观看记录吗？')) {
      history = [];
    }
  }

  onMount(async () => {
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/user/history`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        history = data.data?.list || data.data || [];
      }
    } catch {
      // 未登录或加载失败
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>观看历史 - 影视库</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-base font-bold text-gray-800">观看历史</h1>
      {#if history.length > 0}
        <button onclick={handleClearAll} class="text-xs text-gray-400">清空</button>
      {/if}
    </div>

    {#if loading}
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="bg-white rounded-xl p-3 flex gap-3">
            <div class="w-32 h-20 bg-gray-100 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-100 rounded"></div>
              <div class="h-3 w-2/3 bg-gray-100 rounded"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if history.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm">暂无观看记录</p>
        <a href="/" class="mt-3 text-xs text-[#FF6B9D]">去看看有什么好片子</a>
      </div>
    {:else}
      <div class="space-y-3">
        {#each history as item (item.id)}
          <a href="/v/{item.video_id}" class="bg-white rounded-xl p-3 flex gap-3 active:scale-[0.98] transition-transform">
            <div class="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img src={item.video_cover} alt={item.video_title} loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
                <div class="h-full bg-[#FF6B9D]" style="width: {getProgressPercent(item.progress, item.duration)}%"></div>
              </div>
              <span class="absolute bottom-1 right-1 px-1 py-0.5 text-[9px] text-white bg-black/60 rounded">
                {formatDuration(item.progress)}/{formatDuration(item.duration)}
              </span>
            </div>
            <div class="flex-1 flex flex-col justify-between py-0.5 min-w-0">
              <div>
                <h3 class="text-sm font-medium text-gray-800 line-clamp-2">{item.video_title}</h3>
                {#if item.episode_name}
                  <p class="text-xs text-gray-400 mt-0.5">{item.episode_name}</p>
                {/if}
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-gray-400">{formatDate(item.watch_time)}</span>
                <button onclick={(e) => handleDelete(item.id, e)} class="text-xs text-gray-400">删除</button>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>

  <NavBar />
</div>
