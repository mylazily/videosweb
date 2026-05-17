<script lang="ts">
  import { goto } from '$app/navigation';

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
    rating?: number;
    created_at?: string;
  };

  let { video } = $props<{ video: Video }>();

  let loaded = $state(false);
  let error = $state(false);
  let hovering = $state(false);

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + '千';
    return n.toString();
  }

  function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleClick() {
    goto(`/v/${video.id}`);
  }

  function handleImageLoad() {
    loaded = true;
  }

  function handleImageError() {
    error = true;
    loaded = true;
  }
</script>

<a
  href="/v/{video.id}"
  class="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 {hovering ? 'scale-[1.02]' : ''}"
  onmouseenter={() => hovering = true}
  onmouseleave={() => hovering = false}
>
  <!-- 封面 -->
  <div class="relative aspect-video bg-gray-100 overflow-hidden">
    {#if !loaded && !error}
      <!-- 骨架屏 -->
      <div class="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
    {/if}

    <!-- 图片 -->
    <img
      src={video.cover}
      alt={video.title}
      loading="lazy"
      onload={handleImageLoad}
      onerror={handleImageError}
      class="w-full h-full object-cover transition-transform duration-500 {hovering ? 'scale-110' : ''} {loaded && !error ? '' : 'hidden'}"
    />

    <!-- 错误占位 -->
    {#if error}
      <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    {/if}

    <!-- 时长标签 -->
    {#if video.duration}
      <div class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
        {formatDuration(video.duration)}
      </div>
    {/if}

    <!-- 分类标签 -->
    {#if video.category}
      <div class="absolute top-2 left-2 px-2 py-0.5 bg-[#FB7299] text-white text-xs rounded-full">
        {video.category}
      </div>
    {/if}
  </div>

  <!-- 信息 -->
  <div class="p-2.5">
    <!-- 标题 -->
    <h3 class="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-1.5">
      {video.title}
    </h3>

    <!-- UP主 -->
    {#if video.author}
      <div class="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <span class="truncate">{video.author}</span>
      </div>
    {/if}

    <!-- 统计 -->
    <div class="flex items-center gap-3 text-xs text-gray-400">
      <!-- 播放量 -->
      {#if video.play_count}
        <div class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{formatCount(video.play_count)}</span>
        </div>
      {/if}

      <!-- 弹幕数 -->
      {#if video.danmaku_count}
        <div class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>{formatCount(video.danmaku_count)}</span>
        </div>
      {/if}

      <!-- 点赞数 -->
      {#if video.like_count}
        <div class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.132 6.256a2 2 0 01-2.2.995H5.5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14V6a2 2 0 012-2h2a2 2 0 012 2v8"/>
          </svg>
          <span>{formatCount(video.like_count)}</span>
        </div>
      {/if}
    </div>
  </div>
</a>
