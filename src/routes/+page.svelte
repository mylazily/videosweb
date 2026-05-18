<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import HeaderBar from '$components/HeaderBar.svelte';
  import NavBar from '$components/NavBar.svelte';
  import VideoCard from '$components/VideoCard.svelte';
  import type { Video } from '$lib/types';

  let { data } = $props();

  let videos = $state<Video[]>((data.videos as Video[]) || []);
  let loading = $state(false);
  let hasMore = $state(true);
  let page = $state(1);
  let error = $state('');
  let initialized = $state(false);

  // 无限滚动观察器
  let sentinelEl = $state<HTMLDivElement | null>(null);
  let observer: IntersectionObserver;

  onMount(() => {
    if (videos.length === 0) {
      loadVideos(1);
    } else {
      initialized = true;
    }
    setupInfiniteScroll();
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });

  function setupInfiniteScroll() {
    if (!sentinelEl) return;

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          loadVideos(page + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelEl);
  }

  async function loadVideos(targetPage: number) {
    if (loading) return;
    loading = true;
    error = '';

    try {
      const { getBaseUrl } = await import('$lib/apiConfig');
      const base = getBaseUrl();
      const url = base
        ? `${base}/api/v1/videos?page=${targetPage}&page_size=12`
        : `/api/v1/videos?page=${targetPage}&page_size=12`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) throw new Error('加载失败');

      const data = await res.json();
      const list = data.data?.list || data.data || [];

      if (targetPage === 1) {
        videos = list;
      } else {
        videos = [...videos, ...list];
      }

      page = targetPage;
      hasMore = list.length === 12;
      initialized = true;
    } catch {
      error = targetPage === 1 ? '加载失败，点击重试' : '';
      initialized = true;
    } finally {
      loading = false;
    }
  }

  function retry() {
    error = '';
    loadVideos(1);
  }
</script>

<svelte:head>
  <title>影视库 - 首页</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
</svelte:head>

<div class="app-container">
  <HeaderBar />

  <main class="main-content">
    {#if !initialized && loading}
      <!-- 首次加载骨架屏 -->
      <div class="video-grid">
        {#each Array(6) as _, i}
          <div class="skeleton-card">
            <div class="skeleton-cover"></div>
            <div class="skeleton-info">
              <div class="skeleton-title"></div>
              <div class="skeleton-meta"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if videos.length === 0 && error}
      <!-- 错误状态 -->
      <div class="error-state">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p class="error-text">{error}</p>
        <button class="retry-btn" onclick={retry}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="retry-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          重试
        </button>
      </div>
    {:else if videos.length === 0 && !loading}
      <!-- 空状态 -->
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
          </svg>
        </div>
        <p class="empty-text">暂无内容</p>
        <button class="retry-btn" onclick={retry}>刷新</button>
      </div>
    {:else}
      <!-- 视频网格 -->
      <div class="video-grid">
        {#each videos as video, i (video.id)}
          <div class="video-item" style="animation: fadeSlideIn 0.35s ease-out {Math.min(i % 12, 5) * 40}ms both;">
            <VideoCard {video} />
          </div>
        {/each}

        <!-- 加载更多骨架屏 -->
        {#if loading && page > 1}
          {#each Array(4) as _, i}
            <div class="skeleton-card">
              <div class="skeleton-cover"></div>
              <div class="skeleton-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- 无限滚动哨兵 -->
      {#if videos.length > 0}
        <div bind:this={sentinelEl} class="scroll-sentinel">
          {#if loading && page > 1}
            <div class="loading-spinner"></div>
          {:else if !hasMore}
            <span class="no-more">— 没有更多了 —</span>
          {/if}
        </div>
      {/if}
    {/if}
  </main>

  <NavBar />
</div>

<style>
  .app-container {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--bg, #f4f4f4);
  }

  .main-content {
    padding: 44px 8px 56px;
    max-width: 768px;
    margin: 0 auto;
  }

  /* ========== 视频网格 - B站风格 ========== */
  .video-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 4px 0;
  }

  .video-item {
    min-width: 0;
  }

  /* ========== 骨架屏 ========== */
  .skeleton-card {
    background: var(--surface, #fff);
    border-radius: 8px;
    overflow: hidden;
  }

  .skeleton-cover {
    aspect-ratio: 16 / 9;
    background: linear-gradient(90deg, #eee 25%, #e0e0e0 50%, #eee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  .skeleton-info {
    padding: 8px;
  }

  .skeleton-title {
    height: 14px;
    width: 80%;
    border-radius: 4px;
    background: linear-gradient(90deg, #eee 25%, #e0e0e0 50%, #eee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 6px;
  }

  .skeleton-meta {
    height: 12px;
    width: 50%;
    border-radius: 4px;
    background: linear-gradient(90deg, #eee 25%, #e0e0e0 50%, #eee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ========== 错误/空状态 ========== */
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .error-icon,
  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--divider, #f0f0f0);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .error-icon svg,
  .empty-icon svg {
    width: 32px;
    height: 32px;
    color: var(--text-tertiary, #999);
  }

  .error-text,
  .empty-text {
    font-size: 13px;
    color: var(--text-tertiary, #999);
    margin-bottom: 16px;
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 20px;
    font-size: 13px;
    color: var(--primary, #FB7299);
    border: 1px solid var(--primary, #FB7299);
    border-radius: 20px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-btn:active {
    background: var(--primary-50, #fff0f3);
    transform: scale(0.96);
  }

  .retry-icon {
    width: 14px;
    height: 14px;
  }

  /* ========== 滚动加载 ========== */
  .scroll-sentinel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 0 8px;
    min-height: 40px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--divider, #f0f0f0);
    border-top-color: var(--primary, #FB7299);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .no-more {
    font-size: 12px;
    color: var(--text-tertiary, #bbb);
    letter-spacing: 1px;
  }

  /* ========== 动画 ========== */
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
