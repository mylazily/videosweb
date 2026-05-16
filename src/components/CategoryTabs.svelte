<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    activeSlug?: string;
    onSelect?: (slug: string) => void;
  }

  let { activeSlug = '', onSelect }: Props = $props();

  const defaultTabs = [
    { slug: '', name: '推荐' },
    { slug: 'hot', name: '热门' },
    { slug: 'movie', name: '电影' },
    { slug: 'tv', name: '电视剧' },
    { slug: 'anime', name: '动漫' },
    { slug: 'variety', name: '综艺' },
  ];

  let tabs = $state(defaultTabs);
  let scrollEl = $state<HTMLDivElement>();

  onMount(async () => {
    try {
     	const { getBaseUrl } = await import('$lib/apiConfig');
     	const base = getBaseUrl();
     	const res = await fetch(`${base}/api/v1/categories`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        const cats = data.data || [];
        if (cats.length > 0) tabs = cats;
      }
    } catch { /* use defaults */ }
  });

  function handleWheel(e: WheelEvent) {
    if (scrollEl) {
      e.preventDefault();
      scrollEl.scrollLeft += e.deltaY;
    }
  }
</script>

<div class="sticky top-12 z-40 bg-[#FAFAFA] border-b border-[#F0F0F0]">
  <div
    bind:this={scrollEl}
    class="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar"
    onwheel={handleWheel}
  >
    {#each tabs as tab}
      {@const isActive = (tab.slug || '') === activeSlug}
      <button
        onclick={() => onSelect?.(tab.slug)}
        class="flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 active:scale-95 {isActive ? 'bg-[#FF6B9D] text-white' : 'bg-transparent text-gray-500'}"
      >
        {tab.name}
      </button>
    {/each}
  </div>
</div>
