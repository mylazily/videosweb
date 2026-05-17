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

  let videos = $state<Video[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/videos/hot?page=1&page_size=20`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        videos = data.data?.list || data.data || [];
      }
    } catch {
      // 加载失败
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>影视库</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <HeaderBar />

  <main class="px-2 pt-2 pb-14">
    {#if loading}
      <div class="grid grid-cols-2 gap-2">
        {#each Array(8) as _, i}
          <div class="bg-white rounded-lg overflow-hidden" style="animation: fadeIn 0.3s ease-out {i * 40}ms both;">
            <div class="aspect-video bg-gray-200 animate-pulse"></div>
            <div class="p-2 space-y-1.5">
              <div class="h-3.5 bg-gray-200 rounded w-4/5"></div>
              <div class="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if videos.length === 0}
      <div class="flex flex-col items-center justify-center py-24">
        <div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm">暂无内容</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-2">
        {#each videos as video, i (video.id)}
          <div style="animation: fadeIn 0.3s ease-out {i * 40}ms both;">
            <VideoCard {video} />
          </div>
        {/each}
      </div>
    {/if}
  </main>

  <NavBar />
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
