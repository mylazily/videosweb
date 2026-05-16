<script lang="ts">
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import CategoryTabs from '$components/CategoryTabs.svelte';
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

  let videos = $state<Video[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const { getBaseUrl } = await import('$lib/apiConfig');
    const base = getBaseUrl();

    fetch(`${base}/api/v1/videos/hot?page=1&page_size=12`, { signal: AbortSignal.timeout(3000) })
      .then(r => r.json())
      .then(d => { videos = d.data?.list || d.data || []; })
      .catch(() => {})
      .finally(() => loading = false);
  });
</script>

<svelte:head>
  <title>影视 - 高清在线观看</title>
  <link rel="preconnect" href="https://9901.555554.xyz" />
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />
  <CategoryTabs />

  <main class="px-3 pt-3 pb-20">
    {#if loading}
      <div class="grid grid-cols-2 gap-3">
        {#each Array(6) as _, i}
          <div class="bg-white rounded-xl overflow-hidden" style="animation: fadeIn 0.3s ease-out {i * 50}ms both;">
            <div class="aspect-[3/4] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
            <div class="p-2 space-y-2">
              <div class="h-3 bg-gray-200 rounded"></div>
              <div class="h-2 w-2/3 bg-gray-100 rounded"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if videos.length === 0}
      <div class="flex flex-col items-center justify-center py-20" style="animation: fadeIn 0.3s ease-out;">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm">暂无内容</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-3">
        {#each videos as video, i (video.id)}
          <div style="animation: fadeIn 0.4s ease-out {i * 60}ms both;">
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
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>