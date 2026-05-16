<script lang="ts">
  /**
   * 标签页
   * 统一风格
   */
  import type { Tag } from '$lib/types';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import { onMount } from 'svelte';

  let allTags = $state<Tag[]>([]);
  let filteredTags = $state<Tag[]>([]);
  let searchKeyword = $state('');
  let loading = $state(true);

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  function handleSearch(e: Event) {
    const kw = (e.target as HTMLInputElement).value.toLowerCase();
    searchKeyword = kw;
    if (!kw) {
      filteredTags = allTags;
    } else {
      filteredTags = allTags.filter(t => t.name.toLowerCase().includes(kw));
    }
  }

  onMount(async () => {
    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/tags?page_size=100`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        allTags = data.data?.list || data.data || [];
        filteredTags = allTags;
      }
    } catch {
      // 加载失败
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>标签 - 影视库</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="px-3 pt-3 pb-20">
    <!-- 搜索 -->
    <div class="relative mb-4">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        placeholder="搜索标签..."
        oninput={handleSearch}
        class="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#FF6B9D]/30"
      />
    </div>

    <h2 class="text-base font-bold text-gray-800 mb-3">热门标签</h2>

    {#if loading}
      <div class="flex flex-wrap gap-2">
        {#each Array(20) as _}
          <div class="h-8 w-16 bg-gray-100 rounded-full"></div>
        {/each}
      </div>
    {:else if filteredTags.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <p class="text-gray-400 text-sm">未找到相关标签</p>
      </div>
    {:else}
      <!-- 标签云 -->
      <div class="flex flex-wrap gap-2 mb-6">
        {#each filteredTags as tag, i (tag.slug)}
          <a
            href="/tags/{tag.slug}"
            class="px-3 py-1.5 rounded-full text-sm transition-all active:scale-95"
            class:bg-[#FF6B9D]={i < 5}
            class:text-white={i < 5}
            class:bg-gray-100={i >= 5}
            class:text-gray-600={i >= 5}
          >
            {tag.name}
          </a>
        {/each}
      </div>

      <!-- 标签卡片 -->
      <h2 class="text-base font-bold text-gray-800 mb-3">全部标签</h2>
      <div class="grid grid-cols-2 gap-3">
        {#each filteredTags as tag (tag.slug)}
          <a href="/tags/{tag.slug}" class="bg-white rounded-xl p-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
            {#if tag.cover}
              <img src={tag.cover} alt={tag.name} class="w-10 h-10 rounded-lg object-cover flex-shrink-0" referrerpolicy="no-referrer" loading="lazy" />
            {:else}
              <div class="w-10 h-10 rounded-lg bg-[#FF6B9D]/10 flex items-center justify-center flex-shrink-0">
                <span class="text-[#FF6B9D] font-bold">{tag.name[0]}</span>
              </div>
            {/if}
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium text-gray-800 truncate">{tag.name}</h3>
              <span class="text-[10px] text-gray-400">{formatCount(tag.video_count || 0)}个视频</span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>

  <NavBar />
</div>
