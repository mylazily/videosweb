<script lang="ts">
	/**
	 * 视频详情页（短路由 /v/[id]，增强 SEO 版）
	 * 播放器 + 弹幕 + 视频信息 + 线路切换 + 选集 + 评论
	 * 增强：智能容灾播放器、多线路切换、进度同步、长尾 SEO
	 */
	import type { Video, Comment, Danmaku, PlayLine, Episode } from '$lib/types';
	import { formatPlayCount, formatRating, setPageTitle } from '$lib/utils';
	import P2PVideoPlayer from '$components/P2PVideoPlayer.svelte';
	import DanmakuLayer from '$components/DanmakuLayer.svelte';
	import SourceSwitcher from '$components/SourceSwitcher.svelte';
	import EpisodeList from '$components/EpisodeList.svelte';
	import CommentList from '$components/CommentList.svelte';
	import CommentInput from '$components/CommentInput.svelte';
	import { page } from '$app/state';

	let { data } = $props();

	// 视频数据
	let video = $state<Video>(data.video);
	let comments = $state<Comment[]>(data.comments);
	let danmakus = $state<Danmaku[]>(data.danmakus);

	// 播放线路数据
	let playLines = $state<PlayLine[]>(data.playLines || []);
	let domainPool = $state<string[]>(data.domainPool || []);
	let sharedPath = $state<string>(data.sharedPath || '');
	let videoId = $state<string>(video.id);

	// 播放状态
	let currentLineIndex = $state(0);
	let currentSourceId = $state(video.sources[0]?.source_id || '');
	let currentEpisodeId = $state(video.sources[0]?.episodes[0]?.episode_id || '');
	let currentEpisodes = $state<Episode[]>(video.sources[0]?.episodes || []);

	// UI 状态
	let activeTab = $state<'episodes' | 'comments'>('episodes');
	let commentLoading = $state(false);
	let replyTo = $state<Comment | null>(null);

	// 线路延迟数据
	let lineLatencies = $state<Map<number, number>>(new Map());

	// 设置页面标题
	$effect(() => {
		setPageTitle(video.title);
	});

	// SEO: 动态设置页面 title 和 meta
	$effect(() => {
		if (data.seo) {
			document.title = data.seo.title;
			// Update meta description
			let metaDesc = document.querySelector('meta[name="description"]');
			if (!metaDesc) {
				metaDesc = document.createElement('meta');
				metaDesc.setAttribute('name', 'description');
				document.head.appendChild(metaDesc);
			}
			metaDesc.setAttribute('content', data.seo.description);

			// Update OG tags
			let ogTitle = document.querySelector('meta[property="og:title"]');
			if (ogTitle) ogTitle.setAttribute('content', data.seo.title);
			let ogDesc = document.querySelector('meta[property="og:description"]');
			if (ogDesc) ogDesc.setAttribute('content', data.seo.description);
			let ogImage = document.querySelector('meta[property="og:image"]');
			if (ogImage) ogImage.setAttribute('content', data.seo.ogImage);
			let ogUrl = document.querySelector('meta[property="og:url"]');
			if (ogUrl) ogUrl.setAttribute('content', data.seo.ogUrl);

			// Update canonical
			let canonical = document.querySelector('link[rel="canonical"]');
			if (!canonical) {
				canonical = document.createElement('link');
				canonical.setAttribute('rel', 'canonical');
				document.head.appendChild(canonical);
			}
			canonical.setAttribute('href', data.seo.canonical);
		}
	});

	/**
	 * 线路切换回调（播放器自动切换或手动切换时触发）
	 */
	function handleLineChange(index: number): void {
		currentLineIndex = index;
		console.log(`[详情页] 线路已切换至: ${playLines[index]?.source_name}`);
	}

	/**
	 * 手动切换线路（SourceSwitcher 触发）
	 */
	function handleSourceSwitch(index: number): void {
		currentLineIndex = index;
		console.log(`[详情页] 用户手动切换线路至: ${playLines[index]?.source_name}`);
	}

	/**
	 * 切换播放线路（旧版兼容）
	 */
	function handleSourceSwitchLegacy(source: { source_id: string; source_name: string; episodes: Episode[] }) {
		currentSourceId = source.source_id;
		currentEpisodes = source.episodes;
		currentEpisodeId = source.episodes[0]?.episode_id || '';
	}

	/**
	 * 选择剧集
	 */
	function handleEpisodeSelect(episode: Episode) {
		currentEpisodeId = episode.episode_id;
		// 实际项目中这里会请求新的播放地址
	}

	/**
	 * 播放进度上报
	 */
	function handleTimeUpdate(currentTime: number, duration: number) {
		console.log(`[进度上报] ${currentTime}/${duration}`);
	}

	/**
	 * 发送弹幕
	 */
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

	/**
	 * 提交评论
	 */
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

	/**
	 * 点赞评论
	 */
	function handleLike(commentId: string) {
		comments = comments.map((c) =>
			c.id === commentId
				? { ...c, is_liked: !c.is_liked, like_count: c.is_liked ? c.like_count - 1 : c.like_count + 1 }
				: c
		);
	}

	/**
	 * 回复评论
	 */
	function handleReply(comment: Comment) {
		replyTo = comment;
	}
</script>

<svelte:head>
	{#if data.seo}
		<title>{data.seo.title}</title>
		<meta name="description" content={data.seo.description} />
		<meta name="keywords" content={data.seo.keywords} />
		<meta property="og:title" content={data.seo.title} />
		<meta property="og:description" content={data.seo.description} />
		<meta property="og:image" content={data.seo.ogImage} />
		<meta property="og:url" content={data.seo.ogUrl} />
		<meta property="og:type" content="video.other" />
		<link rel="canonical" href={data.seo.canonical} />
		<script type="application/ld+json">{JSON.stringify(data.seo.structuredData)}</script>
	{/if}
</svelte:head>

<div class="pb-16">
	<!-- 视频播放器 + 弹幕层 -->
	<div class="relative">
		<P2PVideoPlayer
			{playLines}
			{domainPool}
			{sharedPath}
			{videoId}
			onLineChange={handleLineChange}
			onTimeUpdate={(time: number) => handleTimeUpdate(time, 0)}
		/>
		<DanmakuLayer
			danmakus={danmakus}
			onSend={handleSendDanmaku}
		/>
	</div>

	<!-- 当前播放线路信息栏 -->
	{#if playLines.length > 0}
		<div class="px-4 py-2 bg-gray-50 dark:bg-dark-card flex items-center justify-between">
			<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-secondary">
				<span class="inline-block w-2 h-2 rounded-full" style="background-color: #FB7299;"></span>
				<span>当前线路: <strong class="text-gray-900 dark:text-dark-text">{playLines[currentLineIndex]?.source_name || '未知'}</strong></span>
				{#if playLines[currentLineIndex]?.quality}
					<span class="px-1.5 py-0.5 rounded text-[10px]" style="background-color: rgba(251, 114, 153, 0.1); color: #FB7299;">
						{playLines[currentLineIndex].quality}
					</span>
				{/if}
			</div>
			{#if playLines.length > 1}
				<span class="text-[10px] text-gray-400 dark:text-dark-text-secondary">
					共 {playLines.length} 条线路
				</span>
			{/if}
		</div>
	{/if}

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
			{playLines}
			currentIndex={currentLineIndex}
			onSwitch={handleSourceSwitch}
			latencies={lineLatencies}
		/>
	</div>

	<!-- 如果卡顿请切换线路提示 -->
	{#if playLines.length > 1}
		<div class="px-4 mt-2">
			<div class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 dark:text-dark-text-secondary" style="background-color: rgba(251, 114, 153, 0.05);">
				<svg class="w-3.5 h-3.5 flex-shrink-0" style="color: #FB7299;" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
				</svg>
				<span>如果播放卡顿，请尝试切换其他线路</span>
			</div>
		</div>
	{/if}

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
					<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style="background-color: #FB7299;"></div>
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
					<div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style="background-color: #FB7299;"></div>
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
