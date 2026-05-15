<script lang="ts">
	/**
	 * 独立预览缩略图组件
	 * 支持 hover 触发和 touch 触发（移动端长按预览）
	 * 预加载策略：可视区域内的预览图提前加载
	 */
	import { onMount } from 'svelte';

	interface Props {
		src: string;            // 静态封面地址
		previewUrl?: string;    // 预览图地址（GIF/WebP）
		alt?: string;           // 图片描述
		class?: string;         // 自定义样式
		longPressDelay?: number; // 长按触发延迟（毫秒）
	}

	let {
		src,
		previewUrl = '',
		alt = '',
		class: className = '',
		longPressDelay = 500
	}: Props = $props();

	// 预览状态
	let isHovering = $state(false);
	let isLongPressing = $state(false);
	let previewLoaded = $state(false);
	let previewFailed = $state(false);
	let isVisible = $state(false);

	// 是否显示预览
	const showPreview = $derived(
		(isHovering || isLongPressing) && previewLoaded && !previewFailed && !!previewUrl
	);

	// 当前显示的图片地址
	const displaySrc = $derived(showPreview ? previewUrl! : src);

	// 长按相关
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let touchStartY = 0;

	// IntersectionObserver 用于预加载
	let containerEl: HTMLElement;

	onMount(() => {
		// 使用 IntersectionObserver 监听可视区域
		if (!containerEl || !previewUrl) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isVisible = true;
					// 进入可视区域后预加载预览图
					preloadPreview();
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(containerEl);

		return () => observer.disconnect();
	});

	/**
	 * 预加载预览图
	 */
	function preloadPreview() {
		if (!previewUrl || previewLoaded || previewFailed) return;

		const img = new Image();
		img.referrerPolicy = 'no-referrer';
		img.onload = () => {
			previewLoaded = true;
		};
		img.onerror = () => {
			previewFailed = true;
		};
		img.src = previewUrl;
	}

	/**
	 * 鼠标进入
	 */
	function handleMouseEnter() {
		if (!previewUrl) return;
		isHovering = true;
		if (!previewLoaded && !previewFailed) {
			preloadPreview();
		}
	}

	/**
	 * 鼠标离开
	 */
	function handleMouseLeave() {
		isHovering = false;
	}

	/**
	 * 触摸开始（长按预览）
	 */
	function handleTouchStart(e: TouchEvent) {
		if (!previewUrl) return;
		touchStartY = e.touches[0].clientY;
		longPressTimer = setTimeout(() => {
			isLongPressing = true;
			if (!previewLoaded && !previewFailed) {
				preloadPreview();
			}
		}, longPressDelay);
	}

	/**
	 * 触摸移动（取消长按）
	 */
	function handleTouchMove(e: TouchEvent) {
		if (!longPressTimer) return;
		const diffY = Math.abs(e.touches[0].clientY - touchStartY);
		if (diffY > 10) {
			clearLongPress();
		}
	}

	/**
	 * 触摸结束
	 */
	function handleTouchEnd() {
		clearLongPress();
		isLongPressing = false;
	}

	/**
	 * 清除长按定时器
	 */
	function clearLongPress() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={containerEl}
	class="relative overflow-hidden {className}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<img
		src={displaySrc}
		{alt}
		loading="lazy"
		referrerpolicy="no-referrer"
		class="w-full h-full object-cover transition-opacity duration-300"
	/>

	{#if (isHovering || isLongPressing) && !previewLoaded && !previewFailed && previewUrl}
		<!-- 预览加载中骨架动画 -->
		<div class="absolute inset-0 skeleton-shimmer"></div>
	{/if}

	{#if showPreview}
		<!-- 预览指示器 -->
		<div class="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] text-white bg-bilibili/80 rounded">
			预览中
		</div>
	{/if}
</div>
