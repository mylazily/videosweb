<script lang="ts">
  /**
   * 视频详情页（短路由 /v/[id]）
   * 统一风格：与首页一致的视觉体验
   */
  import type { Video, Comment, Danmaku, PlayLine, Episode } from '$lib/types';
  import { formatPlayCount, formatRating, setPageTitle } from '$lib/utils';
  import HeaderBar from '$components/HeaderBar.svelte';
  import DanmakuLayer from '$components/DanmakuLayer.svelte';
  import SourceSwitcher from '$components/SourceSwitcher.svelte';
  import EpisodeList from '$components/EpisodeList.svelte';
  import CommentList from '$components/CommentList.svelte';
  import CommentInput from '$components/CommentInput.svelte';
  import { onMount } from 'svelte';

  let { data } = $props();

  // 动态导入播放器
  let P2PVideoPlayer: any = null;
  onMount(async () => {
    const mod = await import('$components/P2PVideoPlayer.svelte');
    P2PVideoPlayer = mod.default;
  });

  // 视频数据
  let video = $state<Video | null>(data.video || null);
  let comments = $state<Comment[]>(data.comments || []);
  let danmakus = $state<Danmaku[]>(data.danmakus || []);
  let playLines = $state<PlayLine[]>(data.playLines || []);
  let domainPool = $state<string[]>(data.domainPool || []);
  let sharedPath = $state<string>(data.sharedPath || '');
  let videoId = $state<string>(video?.id || '');

  // 播放状态
  let currentLineIndex = $state(0);
  let currentSourceId = $state(video?.sources?.[0]?.source_id || '');
  let currentEpisodeId = $state(video?.sources?.[0]?.episodes?.[0]?.episode_id || '');
  let currentEpisodes = $state<Episode[]>(video?.sources?.[0]?.episodes || []);

  // UI 状态
  let activeTab = $state<'episodes' | 'comments'>('episodes');
  let commentLoading = $state(false);
  let replyTo = $state<Comment | null>(null);
  let lineLatencies = $state<Map<number, number>>(new Map());

  $effect(() => {
    if (video) setPageTitle(video.title);
  });

  function handleLineChange(index: number): void { currentLineIndex = index; }
  function handleSourceSwitch(index: number): void { currentLineIndex = index; }
  function handleEpisodeSelect(episode: Episode) { currentEpisodeId = episode.episode_id; }
  function handleTimeUpdate(currentTime: number, duration: number) {}

  function handleSendDanmaku(content: string) {
    danmakus = [...danmakus, {
      id: `new_${Date.now()}`, time: 0, content, color: '#FFFFFF',
      type: 'scroll', font_size: 16, user_id: 'me'
    }];
  }

  async function handleSubmitComment(content: string) {
    commentLoading = true;
    await new Promise((resolve) => setTimeout(resolve, 500));
    comments = [{
      id: `new_${Date.now()}`, user_id: 'me', username: '我',
      avatar: '/icons/icon-192.png', content, like_count: 0,
      reply_count: 0, create_time: new Date().toISOString(), is_liked: false
    }, ...comments];
    commentLoading = false;
    replyTo = null;
  }

  function handleLike(commentId: string) {
    comments = comments.map((c) =>
      c.id === commentId ? { ...c, is_liked: !c.is_liked, like_count: c.is_liked ? c.like_count - 1 : c.like_count + 1 } : c
    );
  }

  function handleReply(comment: Comment) { replyTo = comment; }
</script>

<svelte:head>
  {#if data.seo}
    <title>{data.seo.title}</title>
    <meta name="description" content={data.seo.description} />
  {:else if video}
    <title>{video.title} - 影视库</title>
  {/if}
</svelte:head>

<div class="min-h-screen bg-[#FAFAFA]">
  <HeaderBar />

  <main class="pb-20">
    {#if !video}
      <!-- 错误状态 -->
      <div class="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-base font-bold text-gray-800 mb-2">视频不存在</h2>
        <p class="text-sm text-gray-500 mb-4">该视频可能已被删除</p>
        <a href="/" class="px-4 py-2 bg-[#FF6B9D] text-white text-sm rounded-full">返回首页</a>
      </div>
    {:else}
      <!-- 播放器 -->
      <div class="relative bg-black">
        {#if P2PVideoPlayer}
          <P2PVideoPlayer {playLines} {domainPool} {sharedPath} {videoId}
            onLineChange={handleLineChange}
            onTimeUpdate={(time: number) => handleTimeUpdate(time, 0)}
          />
        {:else}
          <div class="aspect-video bg-gray-900 flex items-center justify-center">
            <div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        {/if}
        <DanmakuLayer danmakus={danmakus} onSend={handleSendDanmaku} />
      </div>

      <!-- 线路信息 -->
      {#if playLines.length > 0}
        <div class="px-3 py-2 bg-white flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-gray-500">
            <span class="w-2 h-2 rounded-full bg-[#FF6B9D]"></span>
            <span>线路: <strong class="text-gray-800">{playLines[currentLineIndex]?.source_name || '默认'}</strong></span>
          </div>
          {#if playLines.length > 1}
            <span class="text-gray-400">共 {playLines.length} 条</span>
          {/if}
        </div>
      {/if}

      <!-- 视频信息 -->
      <div class="px-3 py-3 bg-white mt-1">
        <h1 class="text-base font-bold text-gray-800 leading-tight">{video.title}</h1>
        <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span class="text-orange-500 font-medium">{formatRating(video.rating)}分</span>
          <span>{formatPlayCount(video.play_count)}播放</span>
          <span>{video.comment_count}评论</span>
          <span>{video.year} / {video.area}</span>
        </div>
        {#if video.tags?.length}
          <div class="flex gap-1.5 mt-2 flex-wrap">
            {#each video.tags as tag}
              <span class="px-2 py-0.5 text-[10px] text-gray-500 bg-gray-100 rounded-full">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="mt-2 text-xs text-gray-500 space-y-1">
          <p>导演：{video.director}</p>
          <p>演员：{Array.isArray(video.actors) ? video.actors.join(' / ') : video.actors}</p>
        </div>
        <p class="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-2">{video.description}</p>
      </div>

      <!-- 线路切换 -->
      {#if playLines.length > 0}
        <div class="px-3 mt-2">
          <SourceSwitcher {playLines} currentIndex={currentLineIndex} onSwitch={handleSourceSwitch} latencies={lineLatencies} />
        </div>
      {/if}

      <!-- 选集 -->
      {#if currentEpisodes.length > 0}
        <div class="px-3 mt-2">
          <EpisodeList episodes={currentEpisodes} currentEpisodeId={currentEpisodeId} onSelect={handleEpisodeSelect} />
        </div>
      {/if}

      <!-- Tab -->
      <div class="px-3 mt-3">
        <div class="flex border-b border-gray-200">
          <button onclick={() => activeTab = 'episodes'}
            class="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative {activeTab === 'episodes' ? 'text-[#FF6B9D]' : 'text-gray-500'}">
            选集
            {#if activeTab === 'episodes'}<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#FF6B9D]"></div>{/if}
          </button>
          <button onclick={() => activeTab = 'comments'}
            class="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative {activeTab === 'comments' ? 'text-[#FF6B9D]' : 'text-gray-500'}">
            评论 ({comments.length})
            {#if activeTab === 'comments'}<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#FF6B9D]"></div>{/if}
          </button>
        </div>
        {#if activeTab === 'comments'}
          <div class="mt-3"><CommentList comments={comments} onLike={handleLike} onReply={handleReply} loading={commentLoading} /></div>
        {/if}
      </div>
    {/if}
  </main>

  <!-- 底部评论输入 -->
  {#if video}
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <CommentInput onSubmit={handleSubmitComment} loading={commentLoading} replyTo={replyTo?.username || ''} />
    </div>
  {/if}
</div>

<style>
  .animate-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
