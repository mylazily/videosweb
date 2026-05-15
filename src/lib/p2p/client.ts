/**
 * P2P WebRTC 客户端
 * 封装 WebRTC 连接管理，支持节点间数据传输
 * 功能：连接对等节点、请求/分享 m3u8 数据、心跳保活、自动重连
 */

import { P2P_ICE_SERVERS, P2P_DATA_CHANNEL_CONFIG, P2P_HEARTBEAT_INTERVAL, P2P_RECONNECT_INTERVAL, P2P_MAX_RECONNECT_ATTEMPTS, P2P_CONNECTION_TIMEOUT } from '$lib/constants';
import { SignalingClient } from './signaling';
import type { Peer, P2PConnectionState, P2PDataMessage, TransferLog } from '$lib/types';

// ========== 类型定义 ==========

/** P2P 客户端配置 */
export interface P2PClientConfig {
	/** 信令服务器地址（可选，默认使用常量配置） */
	signalingServer?: string;
	/** 是否启用自动重连 */
	autoReconnect?: boolean;
	/** 心跳间隔（毫秒） */
	heartbeatInterval?: number;
}

/** P2P 事件回调 */
export interface P2PCallbacks {
	/** 节点连接成功回调 */
	onPeerConnected?: (peerId: string) => void;
	/** 节点断开回调 */
	onPeerDisconnected?: (peerId: string) => void;
	/** 数据接收回调 */
	onDataReceived?: (message: P2PDataMessage) => void;
	/** 连接状态变化回调 */
	onStateChange?: (state: P2PConnectionState) => void;
	/** 传输日志回调 */
	onTransferLog?: (log: TransferLog) => void;
	/** 错误回调 */
	onError?: (error: string) => void;
}

// ========== P2P 客户端类 ==========

/**
 * P2P WebRTC 客户端
 * 管理与对等节点的 WebRTC 连接，支持 m3u8 数据的请求和分享
 */
export class P2PClient {
	/** 客户端配置 */
	private config: Required<P2PClientConfig>;

	/** 事件回调 */
	private callbacks: P2PCallbacks;

	/** 信令客户端 */
	private signaling: SignalingClient;

	/** 当前节点 ID */
	private localPeerId: string;

	/** 已建立的 RTCPeerConnection 映射 (peerId -> RTCPeerConnection) */
	private connections: Map<string, RTCPeerConnection> = new Map();

	/** 数据通道映射 (peerId -> RTCDataChannel) */
	private dataChannels: Map<string, RTCDataChannel> = new Map();

	/** 已连接的节点信息 */
	private peers: Map<string, Peer> = new Map();

	/** 连接状态 */
	private state: P2PConnectionState = 'disconnected';

	/** 心跳定时器 */
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

	/** 重连计数器 */
	private reconnectCount = 0;

	/** 重连定时器 */
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	/** 连接超时定时器映射 */
	private connectionTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

	constructor(config: P2PClientConfig = {}, callbacks: P2PCallbacks = {}) {
		this.config = {
			signalingServer: config.signalingServer || '',
			autoReconnect: config.autoReconnect ?? true,
			heartbeatInterval: config.heartbeatInterval || P2P_HEARTBEAT_INTERVAL
		};
		this.callbacks = callbacks;

		// 初始化信令客户端
		this.signaling = new SignalingClient({
			onSignal: (signal) => this.handleSignal(signal),
			onError: (error) => this.callbacks.onError?.(error)
		});

		this.localPeerId = this.signaling.getPeerId();
	}

	// ========== 公开方法 ==========

	/**
	 * 获取当前节点 ID
	 */
	getPeerId(): string {
		return this.localPeerId;
	}

	/**
	 * 获取当前连接状态
	 */
	getState(): P2PConnectionState {
		return this.state;
	}

	/**
	 * 获取已连接的节点列表
	 */
	getConnectedPeers(): Peer[] {
		return Array.from(this.peers.values()).filter((p) => p.is_connected);
	}

	/**
	 * 连接到对等节点
	 * @param peerId 目标节点 ID
	 * @param signalingServer 信令服务器地址（可选）
	 */
	async connectToPeer(peerId: string, signalingServer?: string): Promise<void> {
		if (this.connections.has(peerId)) {
			console.warn('[P2P] 已存在与该节点的连接:', peerId);
			return;
		}

		this.setState('connecting');

		try {
			// 创建 WebRTC 连接
			const pc = this.createPeerConnection(peerId);

			// 创建数据通道
			const dataChannel = pc.createDataChannel('p2p-data', P2P_DATA_CHANNEL_CONFIG);
			this.setupDataChannel(peerId, dataChannel);

			// 创建 Offer
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			// 通过信令服务器发送 Offer
			await this.signaling.sendOffer(peerId, offer.sdp!);

			// 设置连接超时
			this.setConnectionTimeout(peerId);

			console.log('[P2P] 正在连接节点:', peerId);
		} catch (error) {
			this.setState('failed');
			const msg = error instanceof Error ? error.message : '连接未知错误';
			this.callbacks.onError?.(msg);
			this.handleReconnect();
		}
	}

	/**
	 * 从对等节点请求 m3u8 数据
	 * @param videoId 视频 ID
	 * @param targetPeerId 目标节点 ID（可选，不指定则广播给所有已连接节点）
	 */
	async requestM3U8(videoId: string, targetPeerId?: string): Promise<string | null> {
		const message: P2PDataMessage = {
			type: 'm3u8_request',
			video_id: videoId,
			timestamp: new Date().toISOString()
		};

		if (targetPeerId) {
			// 指定节点请求
			return this.sendDataToPeer(targetPeerId, message);
		}

		// 广播给所有已连接节点，返回第一个成功的结果
		const promises: Promise<string | null>[] = [];
		for (const [peerId] of this.dataChannels) {
			promises.push(this.sendDataToPeer(peerId, message));
		}

		if (promises.length === 0) {
			console.warn('[P2P] 没有可用的对等节点');
			return null;
		}

		// 等待第一个成功的结果
		const results = await Promise.allSettled(promises);
		for (const result of results) {
			if (result.status === 'fulfilled' && result.value) {
				return result.value;
			}
		}

		return null;
	}

	/**
	 * 向其他节点分享 m3u8 数据
	 * @param videoId 视频 ID
	 * @param m3u8Data m3u8 数据内容
	 * @param targetPeerId 目标节点 ID（可选，不指定则广播）
	 */
	async shareM3U8(videoId: string, m3u8Data: string, targetPeerId?: string): Promise<void> {
		const message: P2PDataMessage = {
			type: 'm3u8_response',
			video_id: videoId,
			m3u8_data: m3u8Data,
			timestamp: new Date().toISOString()
		};

		if (targetPeerId) {
			await this.sendDataToPeer(targetPeerId, message);
		} else {
			// 广播给所有已连接节点
			for (const [peerId] of this.dataChannels) {
				await this.sendDataToPeer(peerId, message);
			}
		}
	}

	/**
	 * 注册节点连接回调
	 */
	onPeerConnected(callback: (peerId: string) => void): void {
		this.callbacks.onPeerConnected = callback;
	}

	/**
	 * 注册数据接收回调
	 */
	onDataReceived(callback: (message: P2PDataMessage) => void): void {
		this.callbacks.onDataReceived = callback;
	}

	/**
	 * 初始化 P2P 客户端（注册节点 + 启动心跳）
	 */
	async init(): Promise<void> {
		try {
			await this.signaling.registerPeer();
			this.setState('connected');
			this.startHeartbeat();
			console.log('[P2P] 客户端初始化成功, 节点 ID:', this.localPeerId);
		} catch (error) {
			this.setState('failed');
			const msg = error instanceof Error ? error.message : '初始化未知错误';
			this.callbacks.onError?.(msg);
		}
	}

	/**
	 * 加入视频房间
	 * @param videoId 视频 ID（作为房间 ID）
	 */
	async joinVideoRoom(videoId: string): Promise<void> {
		await this.signaling.joinRoom(videoId);
	}

	/**
	 * 离开视频房间
	 * @param videoId 视频 ID
	 */
	async leaveVideoRoom(videoId: string): Promise<void> {
		await this.signaling.leaveRoom(videoId);
	}

	/**
	 * 断开所有连接
	 */
	disconnect(): void {
		// 停止心跳
		this.stopHeartbeat();

		// 清除重连定时器
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		// 关闭所有数据通道
		for (const [peerId, channel] of this.dataChannels) {
			try {
				channel.close();
			} catch {
				// 忽略关闭错误
			}
		}
		this.dataChannels.clear();

		// 关闭所有 WebRTC 连接
		for (const [peerId, pc] of this.connections) {
			try {
				pc.close();
			} catch {
				// 忽略关闭错误
			}
			this.callbacks.onPeerDisconnected?.(peerId);
		}
		this.connections.clear();

		// 清除连接超时定时器
		for (const timer of this.connectionTimers.values()) {
			clearTimeout(timer);
		}
		this.connectionTimers.clear();

		// 断开信令
		this.signaling.disconnect();

		// 清空节点列表
		this.peers.clear();
		this.reconnectCount = 0;

		this.setState('disconnected');
		console.log('[P2P] 已断开所有连接');
	}

	// ========== 私有方法 ==========

	/**
	 * 创建 RTCPeerConnection
	 */
	private createPeerConnection(peerId: string): RTCPeerConnection {
		const pc = new RTCPeerConnection(P2P_ICE_SERVERS);

		// 监听 ICE 候选者
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.signaling.sendICE(peerId, event.candidate.toJSON());
			}
		};

		// 监听连接状态变化
		pc.onconnectionstatechange = () => {
			switch (pc.connectionState) {
				case 'connected':
					this.handlePeerConnected(peerId);
					break;
				case 'disconnected':
				case 'failed':
				case 'closed':
					this.handlePeerDisconnected(peerId);
					break;
			}
		};

		// 监听数据通道
		pc.ondatachannel = (event) => {
			this.setupDataChannel(peerId, event.channel);
		};

		this.connections.set(peerId, pc);
		return pc;
	}

	/**
	 * 配置数据通道
	 */
	private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
		channel.onopen = () => {
			console.log('[P2P] 数据通道已建立:', peerId);
			this.dataChannels.set(peerId, channel);
		};

		channel.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data) as P2PDataMessage;
				this.handleDataMessage(peerId, message);
			} catch {
				console.warn('[P2P] 数据解析失败');
			}
		};

		channel.onclose = () => {
			console.log('[P2P] 数据通道已关闭:', peerId);
			this.dataChannels.delete(peerId);
		};

		channel.onerror = () => {
			console.warn('[P2P] 数据通道错误:', peerId);
		};
	}

	/**
	 * 处理信令消息
	 */
	private async handleSignal(signal: import('$lib/types').Signal): Promise<void> {
		const { type, from_peer_id } = signal;

		switch (type) {
			case 'offer':
				await this.handleOffer(from_peer_id, signal.sdp!);
				break;
			case 'answer':
				await this.handleAnswer(from_peer_id, signal.sdp!);
				break;
			case 'ice-candidate':
				await this.handleICECandidate(from_peer_id, signal.candidate!);
				break;
		}
	}

	/**
	 * 处理 Offer 信令
	 */
	private async handleOffer(peerId: string, sdp: string): Promise<void> {
		let pc = this.connections.get(peerId);
		if (!pc) {
			pc = this.createPeerConnection(peerId);
		}

		await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));

		// 创建 Answer
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		// 发送 Answer
		await this.signaling.sendAnswer(peerId, answer.sdp!);
	}

	/**
	 * 处理 Answer 信令
	 */
	private async handleAnswer(peerId: string, sdp: string): Promise<void> {
		const pc = this.connections.get(peerId);
		if (!pc) return;

		await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
	}

	/**
	 * 处理 ICE 候选者
	 */
	private async handleICECandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
		const pc = this.connections.get(peerId);
		if (!pc) return;

		try {
			await pc.addIceCandidate(new RTCIceCandidate(candidate));
		} catch {
			// 忽略 ICE 添加错误
		}
	}

	/**
	 * 处理节点连接成功
	 */
	private handlePeerConnected(peerId: string): void {
		// 清除连接超时
		this.clearConnectionTimeout(peerId);

		// 更新节点信息
		const peer = this.peers.get(peerId);
		if (peer) {
			peer.is_connected = true;
			peer.connected_at = new Date().toISOString();
		} else {
			this.peers.set(peerId, {
				peer_id: peerId,
				is_connected: true,
				connected_at: new Date().toISOString(),
				shared_videos: []
			});
		}

		// 重置重连计数
		this.reconnectCount = 0;
		this.setState('connected');

		console.log('[P2P] 节点已连接:', peerId);
		this.callbacks.onPeerConnected?.(peerId);
	}

	/**
	 * 处理节点断开
	 */
	private handlePeerDisconnected(peerId: string): void {
		// 清除连接超时
		this.clearConnectionTimeout(peerId);

		// 更新节点信息
		const peer = this.peers.get(peerId);
		if (peer) {
			peer.is_connected = false;
		}

		// 清理连接和数据通道
		const channel = this.dataChannels.get(peerId);
		if (channel) {
			try { channel.close(); } catch { /* 忽略 */ }
			this.dataChannels.delete(peerId);
		}

		const pc = this.connections.get(peerId);
		if (pc) {
			try { pc.close(); } catch { /* 忽略 */ }
			this.connections.delete(peerId);
		}

		console.log('[P2P] 节点已断开:', peerId);
		this.callbacks.onPeerDisconnected?.(peerId);

		// 如果没有已连接的节点，尝试重连
		if (this.connections.size === 0 && this.config.autoReconnect) {
			this.handleReconnect();
		}
	}

	/**
	 * 处理接收到的数据消息
	 */
	private handleDataMessage(fromPeerId: string, message: P2PDataMessage): void {
		switch (message.type) {
			case 'm3u8_request':
				// 收到 m3u8 请求，触发回调让上层处理
				this.callbacks.onDataReceived?.(message);
				break;
			case 'm3u8_response':
				// 收到 m3u8 数据，触发回调
				this.callbacks.onDataReceived?.(message);
				break;
			case 'heartbeat':
				// 收到心跳，回复心跳
				this.sendDataToPeer(fromPeerId, {
					type: 'heartbeat',
					timestamp: new Date().toISOString()
				});
				break;
			case 'peer_list':
				// 收到节点列表更新
				if (message.peers) {
					for (const peer of message.peers) {
						if (!this.peers.has(peer.peer_id)) {
							this.peers.set(peer.peer_id, peer);
						}
					}
				}
				break;
		}
	}

	/**
	 * 向指定节点发送数据
	 * @returns 如果是 m3u8_response 类型，返回 Promise<string>，否则返回 null
	 */
	private sendDataToPeer(peerId: string, message: P2PDataMessage): Promise<string | null> {
		return new Promise((resolve) => {
			const channel = this.dataChannels.get(peerId);
			if (!channel || channel.readyState !== 'open') {
				resolve(null);
				return;
			}

			// 对于 m3u8_request，设置一次性监听来获取响应
			if (message.type === 'm3u8_request') {
				const responseHandler = (event: MessageEvent) => {
					try {
						const response = JSON.parse(event.data) as P2PDataMessage;
						if (response.type === 'm3u8_response' && response.video_id === message.video_id) {
							channel.removeEventListener('message', responseHandler);
							resolve(response.m3u8_data || null);
						}
					} catch {
						// 忽略解析错误
					}
				};
				channel.addEventListener('message', responseHandler);

				// 5 秒超时
				setTimeout(() => {
					channel.removeEventListener('message', responseHandler);
					resolve(null);
				}, 5000);
			}

			channel.send(JSON.stringify(message));

			if (message.type !== 'm3u8_request') {
				resolve(null);
			}
		});
	}

	/**
	 * 设置连接状态
	 */
	private setState(newState: P2PConnectionState): void {
		if (this.state !== newState) {
			this.state = newState;
			this.callbacks.onStateChange?.(newState);
		}
	}

	/**
	 * 启动心跳
	 */
	private startHeartbeat(): void {
		this.stopHeartbeat();
		this.heartbeatTimer = setInterval(() => {
			this.sendHeartbeatToAll();
		}, this.config.heartbeatInterval);
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
	 * 向所有已连接节点发送心跳
	 */
	private sendHeartbeatToAll(): void {
		const message: P2PDataMessage = {
			type: 'heartbeat',
			timestamp: new Date().toISOString()
		};

		for (const [peerId, channel] of this.dataChannels) {
			if (channel.readyState === 'open') {
				try {
					channel.send(JSON.stringify(message));
				} catch {
					// 发送失败，可能连接已断开
					this.handlePeerDisconnected(peerId);
				}
			}
		}
	}

	/**
	 * 设置连接超时
	 */
	private setConnectionTimeout(peerId: string): void {
		const timer = setTimeout(() => {
			if (!this.peers.get(peerId)?.is_connected) {
				console.warn('[P2P] 连接超时:', peerId);
				this.handlePeerDisconnected(peerId);
			}
		}, P2P_CONNECTION_TIMEOUT);
		this.connectionTimers.set(peerId, timer);
	}

	/**
	 * 清除连接超时
	 */
	private clearConnectionTimeout(peerId: string): void {
		const timer = this.connectionTimers.get(peerId);
		if (timer) {
			clearTimeout(timer);
			this.connectionTimers.delete(peerId);
		}
	}

	/**
	 * 处理自动重连
	 */
	private handleReconnect(): void {
		if (!this.config.autoReconnect) return;
		if (this.reconnectCount >= P2P_MAX_RECONNECT_ATTEMPTS) {
			console.warn('[P2P] 已达到最大重连次数');
			this.setState('failed');
			return;
		}

		this.reconnectCount++;
		this.setState('reconnecting');

		console.log(`[P2P] ${P2P_RECONNECT_INTERVAL / 1000} 秒后尝试第 ${this.reconnectCount} 次重连...`);

		this.reconnectTimer = setTimeout(async () => {
			try {
				await this.init();
			} catch {
				this.handleReconnect();
			}
		}, P2P_RECONNECT_INTERVAL);
	}
}

// ========== 单例导出 ==========

/** 全局 P2P 客户端单例 */
let p2pClientInstance: P2PClient | null = null;

/**
 * 获取 P2P 客户端单例
 */
export function getP2PClient(callbacks?: P2PCallbacks): P2PClient {
	if (!p2pClientInstance) {
		p2pClientInstance = new P2PClient({}, callbacks);
	}
	return p2pClientInstance;
}

/**
 * 销毁 P2P 客户端单例
 */
export function destroyP2PClient(): void {
	if (p2pClientInstance) {
		p2pClientInstance.disconnect();
		p2pClientInstance = null;
	}
}
