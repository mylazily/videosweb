<script lang="ts">
  import { onMount } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';

  const categories = [
    { slug: 'movie', name: '电影', icon: '🎬' },
    { slug: 'tv', name: '电视剧', icon: '📺' },
    { slug: 'anime', name: '动漫', icon: '🎨' },
    { slug: 'variety', name: '综艺', icon: '🎭' },
    { slug: 'documentary', name: '纪录片', icon: '📹' },
  ];

  let activeCategory = $state('movie');
  let videos = $state<{ id: string | number; title: string; cover: string; play_count?: number }[]>([]);
  let loading = $state(false);

  onMount(() => {
    loadVideos('movie');
  });

  async function loadVideos(slug: string) {
    loading = true;
    activeCategory = slug;
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/categories/${slug}/videos?page=1&page_size=20`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        videos = data.data?.list || data.data || [];
      }
    } catch {
      videos = [];
    } finally {
      loading = false;
    }
  }

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString();
  }
</script>

<svelte:head>
  <title>分类</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <HeaderBar />

  <main class="pb-14">
    <!-- 分类标签 -->
    <div class="sticky top-11 z-40 bg-white border-b border-gray-100">
      <div class="flex items-center px-2 h-10 overflow-x-auto no-scrollbar">
        {#each categories as cat}
          <button
            onclick={() => loadVideos(cat.slug)}
            class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all {activeCategory === cat.slug ? 'bg-pink-500 text-white' : 'text-gray-600'}"
          >
            {cat.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- 视频列表 -->
    <div class="px-2 pt-2">
      {#if loading}
        <div class="grid grid-cols-2 gap-2">
          {#each Array(6) as _, i}
            <div class="bg-white rounded-lg overflow-hidden">
              <div class="aspect-video bg-gray-200 animate-pulse"></div>
              <div class="p-2 space-y-1.5">
                <div class="h-3.5 bg-gray-200 rounded w-4/5"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if videos.length === 0}
        <div class="flex flex-col items-center justify-center py-20">
          <p class="text-gray-400 text-sm">暂无内容</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-2">
          {#each videos as video, i (video.id)}
            <a href="/v/{video.id}" class="block bg-white rounded-lg overflow-hidden" style="animation: fadeIn 0.3s ease-out {i * 40}ms both;">
              <div class="aspect-video bg-gray-100">
                <img src={video.cover} alt={video.title} loading="lazy" class="w-full h-full object-cover" />
              </div>
              <div class="p-2">
                <h3 class="text-[13px] text-gray-800 line-clamp-2 leading-tight mb-1">{video.title}</h3>
                {#if video.play_count}
                  <p class="text-[11px] text-gray-400">{formatCount(video.play_count)}次播放</p>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <NavBar />
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
