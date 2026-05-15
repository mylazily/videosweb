<script lang="ts">
	/**
	 * 短视频播放详情页
	 * 全屏播放器 + 弹幕层 + 视频信息 + 上下滑动切换
	 */
	import { onMount } from 'svelte';
	import type { ShortVideo, Comment, Danmaku } from '$lib/types';
	import { formatPlayCount, formatDuration, setPageTitle, copyToClipboard } from '$lib/utils';
	import DanmakuLayer from '$components/DanmakuLayer.svelte';

	let { data } = $props();

	// 短视频数据
	let short = $state<ShortVideo>(data.short);
	let comments = $state<Comment[]>(data.comments);
	let danmakus = $state<Danmaku[]>(data.danmakus);

	// 播放状态
	let isPlaying = $state(false);
	let isLiked = $state(false);
	let likeCount = $state(short.like_count);
	let showShareMenu = $state(false);

	// 滑动切换
	let touchStartY = $state(0);
	let touchDeltaY = $state(0);
	let isSwiping = $state(false);

	// 设置页面标题
	$effect(() => {
		setPageTitle(short.title);
	});

	// 点赞
	function handleLike() {
		isLiked = !isLiked;
		likeCount = isLiked ? likeCount + 1 : likeCount - 1;
	}

	// 分享
	async function handleShare(platform: string) {
		const url = window.location.href;
		const text = short.title;

		switch (platform) {
			case 'twitter':
				window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
				break;
			case 'telegram':
				window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
				break;
			case 'link':
				await copyToClipboard(url);
				break;
		}
		showShareMenu = false;
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

	// 触摸滑动处理
	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;
		touchDeltaY = e.touches[0].clientY - touchStartY;
	}

	function handleTouchEnd() {
		if (!isSwiping) return;
		isSwiping = false;

		// 上滑切换下一个
		if (touchDeltaY < -80) {
			console.log('切换到下一个短视频');
		}
		// 下滑切换上一个
		if (touchDeltaY > 80) {
			console.log('切换到上一个短视频');
		}

		touchDeltaY = 0;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black z-50 flex flex-col"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	style="transform: translateY({touchDeltaY}px); transition: {isSwiping ? 'none' : 'transform 0.3s ease'};"
>
	<!-- 播放器区域 -->
	<div class="flex-1 relative flex items-center justify-center">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			src={short.video_url}
			poster={short.cover}
			class="w-full h-full object-contain"
			playsinline
			autoplay
			loop
			referrerpolicy="no-referrer"
			onplay={() => { isPlaying = true; }}
			onpause={() => { isPlaying = false; }}
		></video>

		<!-- 弹幕层 -->
		<DanmakuLayer
			danmakus={danmakus}
			onSend={handleSendDanmaku}
		/>

		<!-- 播放/暂停按钮 -->
		{#if !isPlaying}
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div class="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
					<svg class="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 5v14l11-7z"/>
					</svg>
				</div>
			</div>
		{/if}

		<!-- 右侧操作栏 -->
		<div class="absolute right-3 bottom-32 flex flex-col items-center gap-5">
			<!-- 作者头像 -->
			<a href="/profile" class="relative">
				<img
					src={short.author.avatar}
					alt={short.author.username}
					class="w-10 h-10 rounded-full border-2 border-white"
					referrerpolicy="no-referrer"
				/>
				<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-bilibili rounded-full flex items-center justify-center">
					<svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
						<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
					</svg>
				</div>
			</a>

			<!-- 点赞 -->
			<button onclick={handleLike} class="flex flex-col items-center btn-press">
				<div class="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6" viewBox="0 0 24 24" fill={isLiked ? '#FB7299' : 'white'}>
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
					</svg>
				</div>
				<span class="text-white text-[10px] mt-1">{formatPlayCount(likeCount)}</span>
			</button>

			<!-- 评论 -->
			<button class="flex flex-col items-center btn-press">
				<div class="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>
					</svg>
				</div>
				<span class="text-white text-[10px] mt-1">{formatPlayCount(short.comment_count)}</span>
			</button>

			<!-- 分享 -->
			<button onclick={() => showShareMenu = !showShareMenu} class="flex flex-col items-center btn-press">
				<div class="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
						<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
					</svg>
				</div>
				<span class="text-white text-[10px] mt-1">{formatPlayCount(short.share_count)}</span>
			</button>
		</div>

		<!-- 滑动提示 -->
		<div class="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-xs">
			{#if touchDeltaY < -30}
				上滑看下一个
			{:else if touchDeltaY > 30}
				下滑看上一个
			{/if}
		</div>
	</div>

	<!-- 底部视频信息 -->
	<div class="relative px-4 pb-6 pt-3" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));">
		<!-- 作者信息 -->
		<div class="flex items-center gap-2 mb-2">
			<span class="text-white font-medium text-sm">@{short.author.username}</span>
		</div>

		<!-- 视频标题 -->
		<h2 class="text-white text-sm font-medium leading-relaxed line-clamp-2">
			{short.title}
		</h2>

		<!-- 标签 -->
		{#if short.tags.length > 0}
			<div class="flex gap-1.5 mt-2 flex-wrap">
				{#each short.tags as tag}
					<span class="px-2 py-0.5 text-[10px] text-bilibili bg-bilibili/20 rounded">
						#{tag}
					</span>
				{/each}
			</div>
		{/if}

		<!-- 播放量信息 -->
		<div class="flex items-center gap-3 mt-2 text-white/50 text-[10px]">
			<span>{formatPlayCount(short.play_count)}播放</span>
			<span>{formatDuration(short.duration)}</span>
		</div>
	</div>

	<!-- 返回按钮 -->
	<a
		href="/short"
		class="absolute top-4 left-4 z-10 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center"
	>
		<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
			<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
		</svg>
	</a>

	<!-- 分享菜单 -->
	{#if showShareMenu}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 z-20 bg-black/50 flex items-end"
			onclick={() => showShareMenu = false}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="w-full bg-white dark:bg-dark-card rounded-t-2xl p-4 pb-8"
				style="padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));"
				onclick={(e) => e.stopPropagation()}
			>
				<h3 class="text-sm font-bold text-gray-900 dark:text-dark-text mb-4 text-center">分享到</h3>
				<div class="flex justify-around mb-4">
					<button onclick={() => handleShare('twitter')} class="flex flex-col items-center gap-1.5 btn-press">
						<div class="w-12 h-12 bg-[#1DA1F2] rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
								<path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
							</svg>
						</div>
						<span class="text-xs text-gray-600 dark:text-dark-text-secondary">X/Twitter</span>
					</button>

					<button onclick={() => handleShare('telegram')} class="flex flex-col items-center gap-1.5 btn-press">
						<div class="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
								<path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
							</svg>
						</div>
						<span class="text-xs text-gray-600 dark:text-dark-text-secondary">Telegram</span>
					</button>

					<button onclick={() => handleShare('link')} class="flex flex-col items-center gap-1.5 btn-press">
						<div class="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
							<svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
								<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
							</svg>
						</div>
						<span class="text-xs text-gray-600 dark:text-dark-text-secondary">复制链接</span>
					</button>
				</div>
				<button
					onclick={() => showShareMenu = false}
					class="w-full py-2.5 text-sm text-gray-500 bg-gray-100 dark:bg-dark-border rounded-full btn-press"
				>
					取消
				</button>
			</div>
		</div>
	{/if}
</div>
