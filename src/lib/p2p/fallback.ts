/**
 * P2P 降级策略
 * 当 API 不可用时自动启用 P2P 模式获取 m3u8 数据
 * 优先尝试 P2P 节点，失败后降级到 API 请求
 */

import { getP2PClient } from './client';
import { getBaseUrl } from '$lib/apiConfig';
import type { Peer, P2PDataMessage } from '$lib/types';

// ========== 类型定义 ==========

/** m3u8 获取结果 */
export interface M3U8FetchResult {
	/** m3u8 数据 */
	data: string;
	/** 数据来源 */
	source: 'p2p' | 'api';
	/** 获取耗时（毫秒） */
	duration: number;
}

/** P2P 降级策略配置 */
export interface FallbackConfig {
	/** P2P 请求超时（毫秒） */
	p2pTimeout?: number;
	/** API 请求超时（毫秒） */
	apiTimeout?: number;
	/** 是否优先使用 P2P */
	p2pFirst?: boolean;
}

// ========== 降级策略类 ==========

/**
 * P2P 降级策略管理器
 * 智能选择数据获取方式：P2P 优先 -> API 降级
 */
export class P2PFallback {
	/** 配置 */
	private config: Required<FallbackConfig>;

	constructor(config: FallbackConfig = {}) {
		this.config = {
			p2pTimeout: config.p2pTimeout || 5000,
			apiTimeout: config.apiTimeout || 10000,
			p2pFirst: config.p2pFirst ?? true
		};
	}

	/**
	 * 获取 m3u8 数据（智能降级）
	 * 优先尝试 P2P 节点，失败后降级到 API 请求
	 * @param videoId 视频 ID
	 * @param episodeId 剧集 ID
	 * @param sourceId 线路 ID
	 * @returns m3u8 数据获取结果
	 */
	async tryP2PFirst(videoId: string, episodeId: string, sourceId: string): Promise<M3U8FetchResult> {
		const startTime = Date.now();

		if (this.config.p2pFirst) {
			// 策略一：P2P 优先
			try {
				const p2pResult = await this.fetchFromP2P(videoId, this.config.p2pTimeout);
				if (p2pResult) {
					return {
						data: p2pResult,
						source: 'p2p',
						duration: Date.now() - startTime
					};
				}
			} catch {
				console.warn('[P2P 降级] P2P 获取失败，降级到 API');
			}

			// 降级到 API
			return this.fetchFromAPI(videoId, episodeId, sourceId, startTime);
		} else {
			// 策略二：API 优先
			try {
				return await this.fetchFromAPI(videoId, episodeId, sourceId, startTime);
			} catch {
				console.warn('[P2P 降级] API 获取失败，尝试 P2P');
			}

			// 降级到 P2P
			const p2pResult = await this.fetchFromP2P(videoId, this.config.p2pTimeout);
			if (p2pResult) {
				return {
					data: p2pResult,
					source: 'p2p',
					duration: Date.now() - startTime
				};
			}

			throw new Error('P2P 和 API 均获取失败');
		}
	}

	/**
	 * 获取指定视频的可用 P2P 节点列表
	 * @param videoId 视频 ID
	 * @returns 可用节点列表
	 */
	async getAvailablePeers(videoId: string): Promise<Peer[]> {
		const client = getP2PClient();
		const connectedPeers = client.getConnectedPeers();

		if (connectedPeers.length === 0) {
			console.log('[P2P 降级] 当前无已连接的 P2P 节点');
			return [];
		}

		// 过滤出分享了对指定视频的节点
		return connectedPeers.filter((peer) =>
			peer.shared_videos.includes(videoId)
		);
	}

	/**
	 * 检查 P2P 是否可用
	 */
	isP2PAvailable(): boolean {
		try {
			const client = getP2PClient();
			return client.getConnectedPeers().length > 0;
		} catch {
			return false;
		}
	}

	// ========== 私有方法 ==========

	/**
	 * 从 P2P 节点获取 m3u8 数据
	 */
	private async fetchFromP2P(videoId: string, timeout: number): Promise<string | null> {
		return new Promise(async (resolve) => {
			// 超时处理
			const timer = setTimeout(() => {
				resolve(null);
			}, timeout);

			try {
				const client = getP2PClient();
				const result = await client.requestM3U8(videoId);
				clearTimeout(timer);
				resolve(result);
			} catch {
				clearTimeout(timer);
				resolve(null);
			}
		});
	}

	/**
	 * 从 API 获取 m3u8 数据
	 */
	private async fetchFromAPI(
		videoId: string,
		episodeId: string,
		sourceId: string,
		startTime: number
	): Promise<M3U8FetchResult> {
		const base = getBaseUrl();
		const response = await fetch(
			`${base}/api/v1/video/play`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					video_id: videoId,
					episode_id: episodeId,
					source_id: sourceId
				})
			}
		);

		if (!response.ok) {
			throw new Error(`API 请求失败: ${response.status}`);
		}

		const data = await response.json();
		const m3u8Url = data.data?.url || data.data?.play_url;

		if (!m3u8Url) {
			throw new Error('API 返回数据中无播放地址');
		}

		// 如果返回的是加密地址，需要解密
		const decryptedUrl = m3u8Url;

		return {
			data: decryptedUrl,
			source: 'api',
			duration: Date.now() - startTime
		};
	}
}

// ========== 单例导出 ==========

/** 全局降级策略单例 */
let fallbackInstance: P2PFallback | null = null;

/**
 * 获取 P2P 降级策略单例
 */
export function getP2PFallback(config?: FallbackConfig): P2PFallback {
	if (!fallbackInstance) {
		fallbackInstance = new P2PFallback(config);
	}
	return fallbackInstance;
}
