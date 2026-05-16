<script lang="ts">
  interface Props {
    video: {
      id: string | number;
      title: string;
      cover: string;
      play_count: number;
      rating: number;
      category?: string;
    };
  }

  let { video }: Props = $props();

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }
</script>

<a href="/v/{video.id}" class="block bg-white rounded-xl overflow-hidden shadow-sm">
  <div class="relative aspect-[3/4]">
    <img
      src={video.cover}
      alt={video.title}
      loading="lazy"
      referrerpolicy="no-referrer"
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
    <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
      <span class="flex items-center gap-1">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        {formatCount(video.play_count)}
      </span>
      {#if video.rating > 0}
        <span class="flex items-center gap-0.5 text-yellow-400">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {video.rating.toFixed(1)}
        </span>
      {/if}
    </div>
    {#if video.category}
      <span class="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] text-white bg-[#FF6B9D] rounded">{video.category}</span>
    {/if}
  </div>
  <div class="p-2">
    <h3 class="text-[13px] text-gray-800 font-medium line-clamp-2 min-h-[2.6em]">{video.title}</h3>
  </div>
</a>
