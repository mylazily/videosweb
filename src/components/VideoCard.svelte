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
  let loaded = $state(false);
  let error = $state(false);

  function formatCount(n: number): string {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  // 图片加载失败处理
  function handleError() {
    error = true;
    loaded = true;
  }
</script>

<a href="/v/{video.id}" class="block bg-white rounded-xl overflow-hidden shadow-sm press group">
  <div class="relative aspect-[3/4] bg-gray-100">
    <!-- 加载占位 - 优化骨架屏 -->
    {#if !loaded}
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
        <div class="absolute inset-0 shimmer-overlay"></div>
      </div>
    {/if}
    
    <!-- 图片 -->
    {#if !error}
      <img
        src={video.cover}
        alt={video.title}
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        class="w-full h-full object-cover transition-all duration-300 {loaded ? 'opacity-100' : 'opacity-0'}"
        onload={() => loaded = true}
        onerror={handleError}
      />
    {:else}
      <!-- 图片加载失败占位 -->
      <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    {/if}
    
    <!-- 渐变遮罩 -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
    
    <!-- 底部信息 -->
    <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
      <span class="flex items-center gap-1 drop-shadow-sm">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        {formatCount(video.play_count)}
      </span>
      {#if video.rating > 0}
        <span class="flex items-center gap-0.5 text-yellow-400 drop-shadow-sm">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {video.rating.toFixed(1)}
        </span>
      {/if}
    </div>
    
    <!-- 分类标签 -->
    {#if video.category}
      <span class="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] text-white bg-[#FF6B9D]/90 rounded backdrop-blur-sm">
        {video.category}
      </span>
    {/if}
  </div>
  
  <!-- 标题 -->
  <div class="p-2.5">
    <h3 class="text-[13px] text-gray-800 font-medium line-clamp-2 min-h-[2.6em] group-hover:text-[#FF6B9D] transition-colors">
      {video.title}
    </h3>
  </div>
</a>

<style>
  .shimmer-overlay {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .press:active {
    transform: scale(0.97);
    transition: transform 0.1s ease-out;
  }
</style>
