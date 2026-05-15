<script lang="ts">
	/**
	 * 视频详情页
	 * 播放器 + 弹幕 + 视频信息 + 线路切换 + 选集 + 评论
	 */
	import type { Video, VideoSource, Episode, Comment, Danmaku } from '$lib/types';
	import { formatPlayCount, formatRating, setPageTitle } from '$lib/utils';
	import VideoPlayer from '$components/VideoPlayer.svelte';
	import DanmakuLayer from '$components/DanmakuLayer.svelte';
	import SourceSwitcher from '$components/SourceSwitcher.svelte';
	import EpisodeList from '$components/EpisodeList.svelte';
	import CommentList from '$components/CommentList.svelte';
	import CommentInput from '$components/CommentInput.svelte';

	let { data } = $props();

	// 视频数据
	let video = $state<Video>(data.video);
	let comments = $state<Comment[]>(data.comments);
	let danmakus = $state<Danmaku[]>(data.danmakus);

	// 播放状态
	let currentSourceId = $state(video.sources[0]?.source_id || '');
	let currentEpisodeId = $state(video.sources[0]?.episodes[0]?.episode_id || '');
	let currentEpisodes = $state<Episode[]>(video.sources[0]?.episodes || []);
	let playUrl = $state('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'); // 示例 m3u8

	// UI 状态
	let activeTab = $state<'episodes' | 'comments'>('episodes');
	let commentLoading = $state(false);
	let replyTo = $state<Comment | null>(null);

	// 设置页面标题
	$effect(() => {
		setPageTitle(video.title);
	});

	// 切换播放线路
	function handleSourceSwitch(source: VideoSource) {
		currentSourceId = source.source_id;
		currentEpisodes = source.episodes;
		currentEpisodeId = source.episodes[0]?.episode_id || '';
	}

	// 选择剧集
	function handleEpisodeSelect(episode: Episode) {
		currentEpisodeId = episode.episode_id;
		// 实际项目中这里会请求新的播放地址
	}

	// 播放进度上报
	function handleTimeUpdate(currentTime: number, duration: number) {
		// 实际项目中上报到后端
		console.log(`[进度上报] ${currentTime}/${duration}`);
	}

	// 发送弹幕
	function handleSendDanmaku(content: string) {
		const newDanmaku: Danmaku = {
			id: `new_${Date.now()}`,
			time: 0,
			content,
			color: '#FFFFFF',
			type: 'scroll',
			font_size: 16,
			user_id: 'me'
		};
		danmakus = [...danmakus, newDanmaku];
	}

	// 提交评论
	async function handleSubmitComment(content: string) {
		commentLoading = true;
		await new Promise((resolve) => setTimeout(resolve, 500));

		const newComment: Comment = {
			id: `new_${Date.now()}`,
			user_id: 'me',
			username: '我',
			avatar: '/icons/icon-192.png',
			content,
			like_count: 0,
			reply_count: 0,
			create_time: new Date().toISOString(),
			is_liked: false
		};

		comments = [newComment, ...comments];
		commentLoading = false;
		replyTo = null;
	}

	// 点赞评论
	function handleLike(commentId: string) {
		comments = comments.map((c) =>
			c.id === commentId
				? { ...c, is_liked: !c.is_liked, like_count: c.is_liked ? c.like_count - 1 : c.like_count + 1 }
				: c
		);
	}

	// 回复评论
	function handleReply(comment: Comment) {
		replyTo = comment;
	}
</script>

<div class="pb-16">
	<!-- 视频播放器 + 弹幕层 -->
	<div class="relative">
		<VideoPlayer
			src={playUrl}
			poster={video.cover}
			onTimeUpdate={handleTimeUpdate}
			onEnded={() => console.log('播放结束')}
			onError={(err: string) => console.error('播放错误:', err)}
		/>
		<DanmakuLayer
			danmakus={danmakus}
			onSend={handleSendDanmaku}
		/>
	</div>

	<!-- 视频信息 -->
	<div class="px-4 py-3 bg-white dark:bg-dark-card">
		<h1 class="text-base font-bold text-gray-900 dark:text-dark-text leading-tight">
			{video.title}
		</h1>

		<div class="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">
			<span class="text-orange-500 font-medium">{formatRating(video.rating)}分</span>
			<span>{formatPlayCount(video.play_count)}播放</span>
			<span>{video.comment_count}评论</span>
			<span>{video.year} / {video.area}</span>
		</div>

		<!-- 标签 -->
		<div class="flex gap-1.5 mt-2 flex-wrap">
			{#each video.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>

		<!-- 导演/演员 -->
		<div class="mt-2 text-xs text-gray-500 dark:text-dark-text-secondary space-y-1">
			<p>导演：{video.director}</p>
			<p>演员：{video.actors.join(' / ')}</p>
		</div>

		<!-- 简介 -->
		<p class="mt-2 text-xs text-gray-600 dark:text-dark-text-secondary leading-relaxed line-clamp-2">
			{video.description}
		</p>
	</div>

	<!-- 播放线路切换 -->
	<div class="px-4 mt-2">
		<SourceSwitcher
			sources={video.sources}
			currentSourceId={currentSourceId}
			onSwitch={handleSourceSwitch}
		/>
	</div>

	<!-- 选集列表 -->
	<div class="px-4 mt-2">
		<EpisodeList
			episodes={currentEpisodes}
			currentEpisodeId={currentEpisodeId}
			onSelect={handleEpisodeSelect}
		/>
	</div>

	<!-- Tab 切换：选集/评论 -->
	<div class="px-4 mt-3">
		<div class="flex border-b border-gray-200 dark:border-dark-border">
			<button
				onclick={() => activeTab = 'episodes'}
				class="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative"
				class:text-bilibili={activeTab === 'episodes'}
				class:text-gray-500={activeTab !== 'episodes'}
				class:dark:text-dark-text-secondary={activeTab !== 'episodes'}
			>
				选集
				{#if activeTab === 'episodes'}
					<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-bilibili rounded-full"></div>
				{/if}
			</button>
			<button
				onclick={() => activeTab = 'comments'}
				class="flex-1 py-2.5 text-sm font-medium text-center transition-colors relative"
				class:text-bilibili={activeTab === 'comments'}
				class:text-gray-500={activeTab !== 'comments'}
				class:dark:text-dark-text-secondary={activeTab !== 'comments'}
			>
				评论 ({comments.length})
				{#if activeTab === 'comments'}
					<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-bilibili rounded-full"></div>
				{/if}
			</button>
		</div>

		<!-- 评论区域 -->
		{#if activeTab === 'comments'}
			<div class="mt-3">
				<CommentList
					comments={comments}
					onLike={handleLike}
					onReply={handleReply}
					loading={commentLoading}
				/>
			</div>
		{/if}
	</div>
</div>

<!-- 底部评论输入框（固定） -->
<div class="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border"
     style="padding-bottom: env(safe-area-inset-bottom, 0px);">
	<CommentInput
		onSubmit={handleSubmitComment}
		loading={commentLoading}
		replyTo={replyTo?.username || ''}
	/>
</div>
