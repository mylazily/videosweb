<script lang="ts">
  /**
   * 分类标签栏 - App风格横向滚动
   */
  import { onMount } from 'svelte';
  import { getBaseUrl } from '$lib/apiConfig';
  import type { Category } from '$lib/types';

  interface Props {
    activeSlug?: string;
    onSelect?: (slug: string) => void;
  }

  let { activeSlug = '', onSelect }: Props = $props();

  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let scrollEl = $state<HTMLDivElement>();

  // 默认分类（API失败时显示）
  const defaultTabs = [
    { slug: '', name: '推荐' },
    { slug: 'hot', name: '热门' },
    { slug: 'movie', name: '电影' },
    { slug: 'tv', name: '电视剧' },
    { slug: 'anime', name: '动漫' },
    { slug: 'variety', name: '综艺' },
  ];

  onMount(async () => {
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/v1/categories`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        categories = data.data || [];
      }
    } catch {
      categories = defaultTabs.map(t => ({ ...t, count: 0, icon: '' }));
    } finally {
      loading = false;
    }
  });

  function handleWheel(e: WheelEvent) {
    if (scrollEl) {
      e.preventDefault();
      scrollEl.scrollLeft += e.deltaY;
    }
  }

  const tabs = $derived(categories.length > 0 ? categories : defaultTabs.map(t => ({ ...t, count: 0, icon: '' })));
</script>

<div class="sticky top-[calc(48px+var(--safe-top))] z-40 bg-[var(--bg)] border-b border-[var(--divider)]">
  <div 
    bind:this={scrollEl}
    class="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar"
    onwheel={handleWheel}
  >
    {#each tabs as tab, i}
      {@const isActive = (tab.slug || '') === activeSlug}
      <button
        onclick={() => onSelect?.(tab.slug)}
        class="flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 press {isActive ? 'bg-[#FF6B9D] text-white' : 'bg-transparent text-[var(--text-secondary)]'}"
        style="animation-delay: {i * 30}ms;"
      >
        {tab.name}
      </button>
    {/each}
  </div>
</div>
