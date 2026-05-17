<script lang="ts">
  import { goto } from '$app/navigation';

  type Video = {
    id: string | number;
    title: string;
    cover: string;
    play_count?: number;
    duration?: number;
    author?: string;
    category?: string;
  };

  let { video } = $props<{ video: Video }>();

  let loaded = $state(false);
  let error = $state(false);

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + '千';
    return n.toString();
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
</script>

<a href="/v/{video.id}" class="block bg-white rounded-lg overflow-hidden">
  <!-- 封面 -->
  <div class="relative aspect-video bg-gray-100">
    {#if !loaded && !error}
      <div class="absolute inset-0 bg-gray-200 animate-pulse"></div>
    {/if}

    <img
      src={video.cover}
      alt={video.title}
      loading="lazy"
      onload={() => loaded = true}
      onerror={() => { error = true; loaded = true; }}
      class="w-full h-full object-cover {loaded && !error ? '' : 'hidden'}"
    />

    {#if error}
      <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    {/if}

    <!-- 时长 -->
    {#if video.duration}
      <div class="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-[10px] rounded">
        {formatDuration(video.duration)}
      </div>
    {/if}
  </div>

  <!-- 信息 -->
  <div class="p-2">
    <h3 class="text-[13px] text-gray-800 line-clamp-2 leading-tight mb-1">{video.title}</h3>
    <div class="flex items-center gap-2 text-[11px] text-gray-400">
      {#if video.author}
        <span class="truncate">{video.author}</span>
      {:else if video.play_count}
        <span>{formatCount(video.play_count)}次播放</span>
      {/if}
    </div>
  </div>
</a>
