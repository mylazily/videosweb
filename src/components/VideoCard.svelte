<script lang="ts">
  import type { Video } from '$lib/types';
  import { formatDuration, formatPlayCount } from '$lib/utils';

  let { video } = $props<{ video: Video }>();

  let loaded = $state(false);
  let imgError = $state(false);
</script>

<a href="/v/{video.id}" class="card">
  <!-- 封面区域 -->
  <div class="cover-wrap">
    {#if !loaded && !imgError}
      <div class="cover-skeleton"></div>
    {/if}

    <img
      src={video.cover}
      alt={video.title}
      loading="lazy"
      decoding="async"
      onload={() => loaded = true}
      onerror={() => { imgError = true; loaded = true; }}
      class="cover-img {loaded && !imgError ? 'visible' : ''}"
    />

    {#if imgError}
      <div class="cover-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
    {/if}

    <!-- 时长标签 -->
    {#if video.duration}
      <span class="duration-tag">{formatDuration(video.duration)}</span>
    {/if}

    <!-- 播放量标签 -->
    {#if video.play_count}
      <span class="play-count-tag">
        <svg viewBox="0 0 16 16" fill="currentColor" class="play-icon">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5V2.5l5 5.5-5 5.5z"/>
        </svg>
        {formatPlayCount(video.play_count)}
      </span>
    {/if}
  </div>

  <!-- 信息区域 -->
  <div class="info">
    <h3 class="title">{video.title}</h3>
    {#if video.category || video.update_time}
      <div class="meta">
        {#if video.category}
          <span class="category-tag">{video.category}</span>
        {/if}
        {#if video.update_time}
          <span class="update-time">{video.update_time}</span>
        {/if}
      </div>
    {/if}
  </div>
</a>

<style>
  .card {
    display: block;
    background: var(--surface, #fff);
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.15s ease;
  }

  .card:active {
    transform: scale(0.97);
  }

  /* ========== 封面 ========== */
  .cover-wrap {
    position: relative;
    aspect-ratio: 16 / 9;
    background: var(--divider, #eee);
    overflow: hidden;
  }

  .cover-skeleton {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #eee 25%, #e0e0e0 50%, #eee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .cover-img.visible {
    opacity: 1;
  }

  .cover-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--divider, #f0f0f0);
  }

  .cover-error svg {
    width: 28px;
    height: 28px;
    color: var(--text-tertiary, #ccc);
  }

  /* ========== 标签 ========== */
  .duration-tag {
    position: absolute;
    bottom: 4px;
    right: 4px;
    padding: 0 4px;
    height: 16px;
    line-height: 16px;
    font-size: 10px;
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 3px;
    font-variant-numeric: tabular-nums;
  }

  .play-count-tag {
    position: absolute;
    bottom: 4px;
    left: 4px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0 4px;
    height: 16px;
    font-size: 10px;
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 3px;
  }

  .play-icon {
    width: 10px;
    height: 10px;
  }

  /* ========== 信息 ========== */
  .info {
    padding: 6px 8px 8px;
  }

  .title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--text-primary, #1a1a1a);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-tertiary, #999);
  }

  .category-tag {
    color: var(--primary, #FB7299);
    font-size: 10px;
  }

  .update-time {
    font-size: 10px;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
</style>
