/**
 * P2P 信令客户端
 * 与后端 /api/v1/p2p/* 通信，负责节点注册、信令交换、心跳保活
 */

import { getBaseUrl } from '$lib/apiConfig';
import { P2P_SIGNALING_SERVER, P2P_HEARTBEAT_INTERVAL } from '$lib/constants';
import type { Signal, Peer } from '$lib/types';

// ========== 类型定义 ==========

/** 信令事件回调 */
export interface SignalingCallbacks {
	onSignal?: (signal: Signal) => void;
	onPeerList?: (peers: Peer[]) => void;
	onError?: (error: string) => void;
	onDisconnect?: () => void;
}

// ========== 信令客户端类 ==========

/**
 * P2P 信令客户端
 * 负责与信令服务器通信，交换 WebRTC 连接所需的 SDP 和 ICE 信息
 */
export class SignalingClient {
	/** 当前节点 ID */
	private peerId: string;

	/** 信令服务器基础地址 */
	private serverUrl: string;

	/** 事件回调 */
	private callbacks: SignalingCallbacks;

	/** 心跳定时器 */
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

	/** 轮询定时器 */
	private pollTimer: ReturnType<typeof setInterval> | null = null;

	/** 是否已连接 */
	private connected = false;

	/** 当前房间 ID */
	private currentRoomId: string = '';

	/** 上次轮询的信令 ID（用于增量拉取） */
	private lastSignalId: string = '';

	constructor(callbacks: SignalingCallbacks = {}) {
		this.peerId = this.generatePeerId();
		this.serverUrl = getBaseUrl() + P2P_SIGNALING_SERVER;
		this.callbacks = callbacks;
	}

	// ========== 公开方法 ==========

	/**
	 * 获取当前节点 ID
	 */
	getPeerId(): string {
		return this.peerId;
	}

	/**
	 * 注册为分发节点
	 * @returns 注册后的节点信息
	 */
	async registerPeer(): Promise<Peer> {
		try {
			const response = await fetch(`${this.serverUrl}/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ peer_id: this.peerId })
			});

			if (!response.ok) {
				throw new Error(`注册失败: ${response.status}`);
			}

			const data = await response.json();
			this.connected = true;

			// 启动心跳
			this.startHeartbeat();

			console.log('[P2P 信令] 节点注册成功:', this.peerId);
			return data.data as Peer;
		} catch (error) {
			const msg = error instanceof Error ? error.message : '注册未知错误';
			this.callbacks.onError?.(msg);
			throw error;
		}
	}

	/**
	 * 发送 Offer SDP 给目标节点
	 */
	async sendOffer(targetPeerId: string, sdp: string): Promise<void> {
		await this.sendSignal({
			type: 'offer',
			from_peer_id: this.peerId,
			to_peer_id: targetPeerId,
			sdp,
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * 发送 Answer SDP 给目标节点
	 */
	async sendAnswer(targetPeerId: string, sdp: string): Promise<void> {
		await this.sendSignal({
			type: 'answer',
			from_peer_id: this.peerId,
			to_peer_id: targetPeerId,
			sdp,
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * 发送 ICE 候选者给目标节点
	 */
	async sendICE(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
		await this.sendSignal({
			type: 'ice-candidate',
			from_peer_id: this.peerId,
			to_peer_id: targetPeerId,
			candidate,
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * 加入房间并开始轮询信令
	 * @param roomId 房间 ID（通常为视频 ID）
	 */
	async joinRoom(roomId: string): Promise<void> {
		this.currentRoomId = roomId;

		try {
			const response = await fetch(`${this.serverUrl}/room/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peer_id: this.peerId,
					room_id: roomId
				})
			});

			if (!response.ok) {
				throw new Error(`加入房间失败: ${response.status}`);
			}

			// 开始轮询信令
			this.startPolling(roomId);
			console.log('[P2P 信令] 已加入房间:', roomId);
		} catch (error) {
			const msg = error instanceof Error ? error.message : '加入房间未知错误';
			this.callbacks.onError?.(msg);
			throw error;
		}
	}

	/**
	 * 离开房间
	 */
	async leaveRoom(roomId: string): Promise<void> {
		this.stopPolling();

		try {
			await fetch(`${this.serverUrl}/room/leave`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					peer_id: this.peerId,
					room_id: roomId
				})
			});
			console.log('[P2P 信令] 已离开房间:', roomId);
		} catch {
			// 离开房间失败静默处理
		}

		if (this.currentRoomId === roomId) {
			this.currentRoomId = '';
		}
	}

	/**
	 * 发送心跳
	 */
	async heartbeat(): Promise<void> {
		try {
			const response = await fetch(`${this.serverUrl}/heartbeat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ peer_id: this.peerId })
			});

			if (!response.ok) {
				console.warn('[P2P 信令] 心跳发送失败');
			}
		} catch {
			console.warn('[P2P 信令] 心跳发送异常');
		}
	}

	/**
	 * 获取房间内的节点列表
	 */
	async getRoomPeers(roomId: string): Promise<Peer[]> {
		try {
			const response = await fetch(
				`${this.serverUrl}/room/peers?room_id=${encodeURIComponent(roomId)}`
			);

			if (!response.ok) {
				return [];
			}

			const data = await response.json();
			return (data.data?.peers || []) as Peer[];
		} catch {
			return [];
		}
	}

	/**
	 * 断开信令连接
	 */
	disconnect(): void {
		this.stopHeartbeat();
		this.stopPolling();
		this.connected = false;
		this.callbacks.onDisconnect?.();
		console.log('[P2P 信令] 已断开连接');
	}

	/**
	 * 更新信令服务器地址（域名切换时使用）
	 */
	updateServerUrl(): void {
		this.serverUrl = getBaseUrl() + P2P_SIGNALING_SERVER;
	}

	// ========== 私有方法 ==========

	/**
	 * 发送信令消息到服务器
	 */
	private async sendSignal(signal: Signal): Promise<void> {
		try {
			const response = await fetch(`${this.serverUrl}/signal`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(signal)
			});

			if (!response.ok) {
				throw new Error(`信令发送失败: ${response.status}`);
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : '信令发送未知错误';
			this.callbacks.onError?.(msg);
		}
	}

	/**
	 * 开始轮询信令
	 */
	private startPolling(roomId: string): void {
		this.stopPolling();

		// 每 2 秒轮询一次
		this.pollTimer = setInterval(async () => {
			await this.pollSignals(roomId);
		}, 2000);
	}

	/**
	 * 轮询信令消息
	 */
	private async pollSignals(roomId: string): Promise<void> {
		try {
			const params = new URLSearchParams({
				peer_id: this.peerId,
				room_id: roomId
			});
			if (this.lastSignalId) {
				params.set('since', this.lastSignalId);
			}

			const response = await fetch(`${this.serverUrl}/signal/poll?${params}`);

			if (!response.ok) return;

			const data = await response.json();
			const signals: Signal[] = data.data?.signals || [];

			if (signals.length > 0) {
				// 更新最后信令 ID
				this.lastSignalId = signals[signals.length - 1].timestamp;

				// 分发信令事件
				for (const signal of signals) {
					// 忽略自己发出的信令
					if (signal.from_peer_id === this.peerId) continue;
					this.callbacks.onSignal?.(signal);
				}
			}
		} catch {
			// 轮询失败静默处理
		}
	}

	/**
	 * 停止轮询
	 */
	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}

	/**
	 * 启动心跳
	 */
	private startHeartbeat(): void {
		this.stopHeartbeat();
		this.heartbeatTimer = setInterval(() => {
			this.heartbeat();
		}, P2P_HEARTBEAT_INTERVAL);
	}

	/**
	 * 停止心跳
	 */
	private stopHeartbeat(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	/**
	 * 生成节点 ID
	 */
	private generatePeerId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).slice(2, 8);
		return `peer_${timestamp}_${random}`;
	}
}
