<script lang="ts">
  import type { Video } from '$lib/types';
  import { formatPlayCount } from '$lib/utils';

  interface Props {
    video: Video;
    index?: number;
    size?: 'normal' | 'large';
  }

  let { video, index = 0, size = 'normal' }: Props = $props();

  // 渐进动画延迟
  const delay = index * 50;
</script>

<a 
  href="/v/{video.id}" 
  class="block group"
  style="animation-delay: {delay}ms;"
>
  <!-- 封面容器 -->
  <div 
    class="relative overflow-hidden bg-[var(--divider)] press"
    class:rounded-xl={size === 'normal'}
    class:rounded-2xl={size === 'large'}
    style="aspect-ratio: 3/4;"
  >
    <img
      src={video.cover}
      alt={video.title}
      loading="lazy"
      referrerpolicy="no-referrer"
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    
    <!-- 渐变遮罩 -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
    
    <!-- 底部信息 -->
    <div class="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
      <div class="flex items-center gap-1.5 text-white/90 text-[11px]">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span>{formatPlayCount(video.play_count)}</span>
      </div>
      {#if video.rating > 0}
        <div class="flex items-center gap-0.5 text-[#FFD700] text-[11px] font-medium">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{video.rating.toFixed(1)}</span>
        </div>
      {/if}
    </div>

    <!-- 分类标签 -->
    {#if video.category}
      <div class="absolute top-2 left-2">
        <span class="px-1.5 py-0.5 text-[10px] text-white bg-[#FF6B9D] rounded-md font-medium">
          {video.category}
        </span>
      </div>
    {/if}
  </div>

  <!-- 标题 -->
  <div class="mt-2 px-0.5">
    <h3 class="text-[13px] leading-[1.4] text-[var(--text-primary)] font-medium line-clamp-2 min-h-[2.8em]">
      {video.title}
    </h3>
    <p class="mt-1 text-[11px] text-[var(--text-tertiary)] truncate">
      {video.year || '影视'} · {video.area || '其他'}
    </p>
  </div>
</a>

<style>
  a {
    animation: fadeIn 0.4s ease-out forwards;
    opacity: 0;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
