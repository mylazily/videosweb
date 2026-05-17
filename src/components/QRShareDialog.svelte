<script lang="ts">
	/**
	 * QR 分享弹窗组件
	 * 显示 QR 码、分享链接、社交分享按钮
	 * 使用 SVG 内联生成 QR 码，不依赖外部库
	 * 使用 Svelte 5 runes
	 */
	import { generateQRCode } from '$lib/share/qrcode';
	import { copyShareLink, getTwitterShareURL } from '$lib/social/twitter';
	import { getActiveDomain } from '$lib/domain/rotation';
	import { THEME } from '$lib/constants';
	import type { Video } from '$lib/types';

	interface Props {
		video: Video;
		onClose: () => void;
	}

	let { video, onClose }: Props = $props();

	// QR 码 SVG
	let qrSvg = $state('');
	let shareUrl = $state('');
	let copied = $state(false);

	// 生成 QR 码
	$effect(() => {
		const domain = getActiveDomain();
		shareUrl = `${domain}/v/${video.id}`;
		qrSvg = generateQRCode(shareUrl, 200, {
			fgColor: THEME.PRIMARY,
			bgColor: '#FFFFFF'
		});
	});

	/**
	 * 复制链接
	 */
	async function handleCopy(): Promise<void> {
		const success = await copyShareLink(video);
		if (success) {
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		}
	}

	/**
	 * 分享到 X.com
	 */
	function handleShareTwitter(): void {
		const url = getTwitterShareURL(video);
		window.open(url, '_blank', 'width=600,height=400');
	}

	/**
	 * 分享到微信（复制链接提示）
	 */
	function handleShareWechat(): void {
		handleCopy();
	}

	/**
	 * 复制链接
	 */
	function handleCopyLink(): void {
		handleCopy();
	}

	/**
	 * 阻止弹窗点击穿透
	 */
	function handleOverlayClick(e: MouseEvent): void {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
	onclick={handleOverlayClick}
	role="dialog"
	aria-label="分享弹窗"
>
	<div class="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
		<!-- 标题 -->
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-bold text-gray-900 dark:text-dark-text">分享给好友</h3>
			<button
				onclick={onClose}
				class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-500"
				aria-label="关闭"
			>
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
					<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
				</svg>
			</button>
		</div>

		<!-- QR 码 -->
		<div class="flex justify-center mb-4">
			<div class="bg-white p-3 rounded-xl shadow-sm">
				{@html qrSvg}
			</div>
		</div>

		<!-- 分享链接 -->
		<div class="flex items-center gap-2 mb-4">
			<input
				type="text"
				value={shareUrl}
				readonly
				class="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-dark-border outline-none"
			/>
			<button
				onclick={handleCopy}
				class="px-3 py-2 text-xs font-medium rounded-lg btn-press whitespace-nowrap"
				class:bg-bilibili={!copied}
				class:bg-green-500={copied}
				class:text-white={true}
			>
				{copied ? '已复制' : '复制'}
			</button>
		</div>

		<!-- 社交分享按钮 -->
		<div class="flex justify-center gap-4 mb-4">
			<!-- X.com -->
			<button
				onclick={handleShareTwitter}
				class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg btn-press"
				aria-label="分享到 X"
			>
				<svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
				</svg>
				<span class="text-[10px] text-gray-500">X.com</span>
			</button>

			<!-- 复制链接 -->
			<button
				onclick={handleCopyLink}
				class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg btn-press"
				aria-label="复制链接"
			>
				<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
					<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
				</svg>
				<span class="text-[10px] text-gray-500">复制链接</span>
			</button>

			<!-- 微信 -->
			<button
				onclick={handleShareWechat}
				class="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg btn-press"
				aria-label="分享到微信"
			>
				<svg class="w-6 h-6" viewBox="0 0 24 24" fill="#07C160">
					<path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.845 4.508c-3.794 0-6.874 2.694-6.874 6.017 0 3.324 3.08 6.017 6.874 6.017.778 0 1.534-.118 2.244-.334a.723.723 0 0 1 .596.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.024-.12-.04-.178l-.326-1.233a.49.49 0 0 1 .177-.554C21.895 19.378 22.8 17.6 22.8 15.516c0-3.323-3.08-6.017-6.357-6.017zm-2.347 3.394c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.694 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
				</svg>
				<span class="text-[10px] text-gray-500">微信</span>
			</button>
		</div>

		<!-- 邀请奖励说明 -->
		<div class="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl p-3 text-center">
			<p class="text-xs font-medium text-bilibili">
				邀请好友解锁高清内容
			</p>
			<p class="text-[10px] text-gray-400 mt-1">
				每成功邀请一位好友可获得 50 金币奖励
			</p>
		</div>
	</div>
</div>
