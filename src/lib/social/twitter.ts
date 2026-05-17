/**
 * X.com (Twitter) 分享工具
 * 生成分享文案、分享链接、复制链接
 */

import type { Video } from '$lib/types';
import { SITE_BASE_URL } from '$lib/constants';

/**
 * 生成 X.com 分享文案
 * @param video 视频信息
 * @returns 分享文案字符串
 */
export function generateShareText(video: Video): string {
	const title = video.title;
	const tags = video.tags.slice(0, 3).map(t => `#${t}`).join(' ');
	const rating = video.rating > 0 ? ` 评分 ${video.rating}` : '';
	const url = `${SITE_BASE_URL}/v/${video.id}`;

	return `${title}${rating}\n${tags}\n${url}`;
}

/**
 * 生成 X.com 分享链接
 * @param video 视频信息
 * @returns 完整的 X.com 分享 URL
 */
export function getTwitterShareURL(video: Video): string {
	const text = generateShareText(video);
	const encodedText = encodeURIComponent(text);
	const encodedUrl = encodeURIComponent(`${SITE_BASE_URL}/v/${video.id}`);

	return `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
}

/**
 * 复制分享链接到剪贴板
 * @param video 视频信息
 * @returns 是否复制成功
 */
export async function copyShareLink(video: Video): Promise<boolean> {
	const url = `${SITE_BASE_URL}/v/${video.id}`;

	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(url);
			return true;
		}

		// 降级方案：使用 textarea
		const textarea = document.createElement('textarea');
		textarea.value = url;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		const success = document.execCommand('copy');
		document.body.removeChild(textarea);
		return success;
	} catch {
		return false;
	}
}

/**
 * 生成微信分享链接（通过微信 JS-SDK 或直接复制）
 * @param video 视频信息
 * @returns 分享链接
 */
export function getWechatShareURL(video: Video): string {
	return `${SITE_BASE_URL}/v/${video.id}`;
}

/**
 * 生成通用分享链接
 * @param video 视频信息
 * @param platform 分享平台
 * @returns 对应平台的分享链接
 */
export function getShareURL(video: Video, platform: 'twitter' | 'wechat' | 'link'): string {
	switch (platform) {
		case 'twitter':
			return getTwitterShareURL(video);
		case 'wechat':
			return getWechatShareURL(video);
		case 'link':
			return `${SITE_BASE_URL}/v/${video.id}`;
		default:
			return `${SITE_BASE_URL}/v/${video.id}`;
	}
}
