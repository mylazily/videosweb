<script lang="ts">
	/**
	 * 通用懒加载图片组件
	 * 使用 IntersectionObserver 实现视口检测
	 * 进入视口前显示骨架屏/占位色块，进入视口后加载真实图片
	 * 加载失败时显示默认占位图
	 */
	import { THEME } from '$lib/constants';

	interface Props {
		/** 图片地址 */
		src: string;
		/** 图片描述（alt 属性） */
		alt?: string;
		/** 自定义 CSS 类名 */
		class?: string;
		/** 自定义样式 */
		style?: string;
		/** 占位背景颜色（默认灰色） */
		placeholderColor?: string;
		/** 占位宽度（CSS 值，如 '100%'） */
		width?: string;
		/** 占位高度（CSS 值，如 '200px'） */
		height?: string;
		/** 是否使用 referrerpolicy="no-referrer"（默认 true） */
		noReferrer?: boolean;
		/** 图片加载模式（默认 lazy） */
		loading?: 'lazy' | 'eager';
		/** 图片 object-fit（默认 cover） */
		objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
		/** 是否显示加载动画（默认 true） */
		showAnimation?: boolean;
		/** 圆角样式 */
		rounded?: string;
	}

	let {
		src,
		alt = '',
		class: className = '',
		style = '',
		placeholderColor = THEME.DARK_CARD || '#222325',
		width = '100%',
		height = 'auto',
		noReferrer = true,
		loading = 'lazy',
		objectFit = 'cover',
		showAnimation = true,
		rounded = ''
	}: Props = $props();

	// 图片状态
	let isVisible = $state(false);
	let isLoaded = $state(false);
	let hasError = $state(false);

	// 容器元素引用
	let containerEl: HTMLElement;

	// IntersectionObserver 监听视口
	$effect(() => {
		if (!containerEl) return;

		// 如果是 eager 模式，直接加载
		if (loading === 'eager') {
			isVisible = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isVisible = true;
					observer.disconnect();
				}
			},
			{
				rootMargin: '200px 0px', // 提前 200px 开始加载
				threshold: 0
			}
		);

		observer.observe(containerEl);

		return () => observer.disconnect();
	});

	/**
	 * 图片加载成功
	 */
	function handleLoad(): void {
		isLoaded = true;
		hasError = false;
	}

	/**
	 * 图片加载失败
	 */
	function handleError(): void {
		hasError = true;
		isLoaded = false;
	}

	/**
	 * 默认占位图 SVG（内联 data URI）
	 */
	function getPlaceholderSrc(): string {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
			<rect fill="${encodeURIComponent(placeholderColor)}" width="400" height="225"/>
			<path fill="%23666" d="M175 100l25-30 25 30h-50zm-50 50l50-60 50 60h-100zm100-20l25-30 25 30h-50z"/>
		</svg>`;
		return `data:image/svg+xml,${svg}`;
	}
</script>

<!-- svelte-ignore a11y_img_redundant_alt -->
<div
	bind:this={containerEl}
	class="relative overflow-hidden {rounded} {className}"
	style="width: {width}; height: {height}; {style};"
>
	{#if !isVisible}
		<!-- 占位色块（未进入视口） -->
		<div
			class="w-full h-full"
			style="background-color: {placeholderColor};"
		>
			{#if showAnimation}
				<div class="absolute inset-0 skeleton-shimmer"></div>
			{/if}
		</div>
	{:else if hasError}
		<!-- 加载失败：显示默认占位图 -->
		<img
			src={getPlaceholderSrc()}
			alt={alt || '图片加载失败'}
			class="w-full h-full"
			style="object-fit: {objectFit};"
		/>
	{:else}
		<!-- 真实图片 -->
		<img
			src={src}
			{alt}
			loading={loading}
			referrerpolicy={noReferrer ? 'no-referrer' : undefined}
			class="w-full h-full transition-opacity duration-300"
			style="object-fit: {objectFit}; opacity: {isLoaded ? 1 : 0};"
			onload={handleLoad}
			onerror={handleError}
		/>
		{#if !isLoaded && showAnimation}
			<!-- 加载中骨架动画 -->
			<div class="absolute inset-0 skeleton-shimmer"></div>
		{/if}
	{/if}
</div>
