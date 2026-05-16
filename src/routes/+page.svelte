<script lang="ts">
        /**
         * 首页
         * 小红书式瀑布流布局 + 分类标签 + 热门视频 + 最新更新
         * 支持无限滚动加载
         *
         * 数据来源（与后端 router.go 严格对应）：
         * - hotVideos: GET /api/v1/videos/hot
         * - latestVideos: GET /api/v1/videos/latest
         * - randomVideos: GET /api/v1/videos/random
         * - hotWords: GET /api/v1/search/hot
         */
        import { onMount } from 'svelte';
        import type { Video } from '$lib/types';
        import HeaderBar from '$components/HeaderBar.svelte';
        import NavBar from '$components/NavBar.svelte';
        import CategoryTabs from '$components/CategoryTabs.svelte';
        import PullRefresh from '$components/PullRefresh.svelte';
        import SkeletonCard from '$components/SkeletonCard.svelte';
        import WaterfallGrid from '$components/WaterfallGrid.svelte';
        import { getBaseUrl } from '$lib/apiConfig';

        let allVideos = $state<Video[]>([]);
        let hotWords = $state<any[]>([]);
        let loading = $state(true);
        let hasMore = $state(true);
        let currentPage = $state(1);

        /** 基于 video id 的确定性哈希函数，避免 Math.random() 导致布局闪烁 */
        function hashCode(str: string): number {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                        const char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash |= 0;
                }
                return Math.abs(hash);
        }

        /** 加载首页数据 */
        async function loadHomeData() {
                try {
                        const base = getBaseUrl();
                        const [hotRes, latestRes, randomRes, hotWordsRes] = await Promise.allSettled([
                                fetch(`${base}/api/v1/videos/hot?page=1&page_size=12`),
                                fetch(`${base}/api/v1/videos/latest?page=1&page_size=12`),
                                fetch(`${base}/api/v1/videos/random?page_size=6`),
                                fetch(`${base}/api/v1/search/hot`)
                        ]);

                        const videos: Video[] = [];
                        if (hotRes.status === 'fulfilled' && hotRes.value.ok) {
                                const data = await hotRes.value.json();
                                videos.push(...(data.data?.list || data.data || []));
                        }
                        if (latestRes.status === 'fulfilled' && latestRes.value.ok) {
                                const data = await latestRes.value.json();
                                videos.push(...(data.data?.list || data.data || []));
                        }
                        if (randomRes.status === 'fulfilled' && randomRes.value.ok) {
                                const data = await randomRes.value.json();
                                videos.push(...(data.data?.list || data.data || []));
                        }
                        if (videos.length > 0) {
                                allVideos = videos;
                        }
                        if (hotWordsRes.status === 'fulfilled' && hotWordsRes.value.ok) {
                                const data = await hotWordsRes.value.json();
                                hotWords = data.data || data.hot_words || data.words || [];
                        }
                } catch {
                        // 加载失败，显示空状态
                } finally {
                        loading = false;
                }
        }

        onMount(() => {
                loadHomeData();
        });

        // 下拉刷新
        async function handleRefresh() {
                loading = true;
                currentPage = 1;
                hasMore = true;
                await loadHomeData();
        }

        // 加载更多
        async function handleLoadMore() {
                if (loading || !hasMore) return;
                loading = true;
                currentPage++;

                try {
                        const base = getBaseUrl();
                        const response = await fetch(`${base}/api/v1/videos/hot?page=${currentPage}&page_size=10`);
                        if (!response.ok) throw new Error('Failed to load');
                        const data = await response.json();
                        const newVideos: Video[] = data.data?.list || data.data || [];

                        if (newVideos.length > 0) {
                                allVideos = [...allVideos, ...newVideos];
                        } else {
                                hasMore = false;
                        }
                } catch {
                        hasMore = false;
                } finally {
                        loading = false;
                }
        }

        // 分类选择
        function handleCategorySelect(slug: string) {
                window.location.href = `/category/${slug}`;
        }
</script>

<svelte:head>
        <title>XVideos 影视 - 高清影视在线观看</title>
        <meta name="description" content="XVideos 影视聚合系统 - 在线观看最新电影、电视剧、动漫、综艺、短视频" />
</svelte:head>

<div class="min-h-screen bg-[var(--bg-primary)]">
        <!-- 顶部导航 -->
        <HeaderBar />

        <!-- 分类标签 -->
        <CategoryTabs on:select={handleCategorySelect} />

        <!-- 内容区域 -->
        <PullRefresh on:refresh={handleRefresh}>
                {#if loading && allVideos.length === 0}
                        <!-- 首次加载骨架屏 -->
                        <div class="grid grid-cols-2 gap-3 px-3 pb-4">
                                {#each Array(6) as _}
                                        <SkeletonCard />
                                {/each}
                        </div>
                {:else if allVideos.length === 0}
                        <!-- 空状态 -->
                        <div class="flex flex-col items-center justify-center py-20 text-gray-400">
                                <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                                <p class="text-sm">暂无内容，下拉刷新试试</p>
                        </div>
                {:else}
                        <!-- 瀑布流视频列表 -->
                        <WaterfallGrid {allVideos} />

                        <!-- 加载更多 -->
                        {#if hasMore}
                                <div class="flex justify-center py-4">
                                        {#if loading}
                                                <LoadingSpinner />
                                        {:else}
                                                <button onclick={handleLoadMore} class="text-sm text-[var(--text-secondary)] px-6 py-2 rounded-full border border-[var(--border-color)]">
                                                        加载更多
                                                </button>
                                        {/if}
                                </div>
                        {/if}
                {/if}
        </PullRefresh>

        <!-- 底部导航 -->
        <NavBar />
</div>
