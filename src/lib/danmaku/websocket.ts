/**
 * 弹幕 WebSocket 客户端
 * 封装 WebSocket 连接，支持自动重连、心跳保活
 * 用于实时弹幕推送
 */

import type { Danmaku, WSDanmakuMessage, WSConnectionState } from '$lib/types';
import {
	DANMAKU_WS_URL,
	WS_HEARTBEAT_INTERVAL,
	WS_RECONNECT_INTERVAL,
	WS_MAX_RECONNECT_ATTEMPTS
} from '$lib/constants';

/** 弹幕消息回调 */
export type DanmakuMessageCallback = (danmaku: Danmaku) => void;

/** 在线人数回调 */
export type OnlineCountCallback = (count: number) => void;

/** 连接状态变化回调 */
export type ConnectionStateCallback = (state: WSConnectionState) => void;

/**
 * DanmakuWS - 弹幕 WebSocket 客户端
 *
 * 功能：
 * - 连接到弹幕 WebSocket 服务器
 * - 发送/接收弹幕
 * - 自动重连（3秒重试，最多5次）
 * - 心跳保活（30秒）
 * - 在线人数统计
 */
export class DanmakuWS {
	private ws: WebSocket | null = null;
	private videoId: string = '';
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectAttempts: number = 0;
	private isDestroyed: boolean = false;
	private _state: WSConnectionState = 'disconnected';

	// 回调函数
	private danmakuCallbacks: DanmakuMessageCallback[] = [];
	private onlineCountCallbacks: OnlineCountCallback[] = [];
	private stateCallbacks: ConnectionStateCallback[] = [];

	/** 当前连接状态 */
	get state(): WSConnectionState {
		return this._state;
	}

	/** 是否已连接 */
	get isConnected(): boolean {
		return this._state === 'connected';
	}

	/**
	 * 连接到弹幕 WebSocket
	 * @param videoId 视频 ID
	 */
	connect(videoId: string): void {
		if (this.isDestroyed) return;

		this.videoId = videoId;
		this.reconnectAttempts = 0;
		this._connect();
	}

	/**
	 * 内部连接方法
	 */
	private _connect(): void {
		if (this.isDestroyed) return;

		this.setState('connecting');

		try {
			// 构建 WebSocket URL
			const wsUrl = `${DANMAKU_WS_URL}?video_id=${encodeURIComponent(this.videoId)}`;

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				if (this.isDestroyed) return;
				this.setState('connected');
				this.reconnectAttempts = 0;
				this.startHeartbeat();
			};

			this.ws.onmessage = (event) => {
				if (this.isDestroyed) return;
				this.handleMessage(event);
			};

			this.ws.onclose = (event) => {
				if (this.isDestroyed) return;
				this.stopHeartbeat();

				// 非正常关闭时尝试重连
				if (!event.wasClean && this.reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
					this.scheduleReconnect();
				} else {
					this.setState('disconnected');
				}
			};

			this.ws.onerror = () => {
				if (this.isDestroyed) return;
				// onerror 后会触发 onclose，重连逻辑在 onclose 中处理
			};
		} catch (error) {
			console.error('[弹幕WS] 连接失败:', error);
			this.setState('disconnected');

			if (this.reconnectAttempts < WS_MAX_RECONNECT_ATTEMPTS) {
				this.scheduleReconnect();
			}
		}
	}

	/**
	 * 处理收到的消息
	 */
	private handleMessage(event: MessageEvent): void {
		try {
			const message: WSDanmakuMessage = JSON.parse(event.data);

			switch (message.type) {
				case 'danmaku': {
					// 弹幕消息
					const data = message.data as WSDanmakuMessage['data'] & {
						id: string;
						video_id: string;
						time: number;
						content: string;
						color: string;
						type: import('$lib/types').DanmakuType;
						font_size: number;
						user_id: string;
						username: string;
						vip_level: number;
					};

					const danmaku: Danmaku = {
						id: data.id,
						time: data.time,
						content: data.content,
						color: data.vip_level >= 1 ? this.getVIPColor(data.vip_level) : data.color,
						type: data.type,
						font_size: data.font_size,
						user_id: data.user_id
					};

					this.danmakuCallbacks.forEach(cb => cb(danmaku));
					break;
				}

				case 'online_count': {
					// 在线人数
					const data = message.data as { count: number };
					this.onlineCountCallbacks.forEach(cb => cb(data.count));
					break;
				}

				case 'heartbeat_ack': {
					// 心跳响应，无需处理
					break;
				}

				case 'error': {
					const data = message.data as { message: string };
					console.warn('[弹幕WS] 服务器错误:', data.message);
					break;
				}
			}
		} catch (error) {
			console.error('[弹幕WS] 消息解析失败:', error);
		}
	}

	/**
	 * 获取 VIP 弹幕颜色
	 */
	private getVIPColor(level: number): string {
		if (level >= 2) return '#FF69B4'; // 彩虹色（简化为粉色）
		return '#FFD700'; // VIP1 金色
	}

	/**
	 * 发送弹幕
	 * @param danmaku 弹幕数据
	 */
	send(danmaku: Omit<Danmaku, 'id'>): void {
		if (!this.ws || this._state !== 'connected') {
			console.warn('[弹幕WS] 未连接，无法发送弹幕');
			return;
		}

		const message = {
			type: 'danmaku',
			data: {
				...danmaku,
				video_id: this.videoId,
				timestamp: Date.now()
			}
		};

		this.ws.send(JSON.stringify(message));
	}

	/**
	 * 注册弹幕消息回调
	 */
	onMessage(callback: DanmakuMessageCallback): () => void {
		this.danmakuCallbacks.push(callback);
		return () => {
			this.danmakuCallbacks = this.danmakuCallbacks.filter(cb => cb !== callback);
		};
	}

	/**
	 * 注册在线人数回调
	 */
	onOnlineCount(callback: OnlineCountCallback): () => void {
		this.onlineCountCallbacks.push(callback);
		return () => {
			this.onlineCountCallbacks = this.onlineCountCallbacks.filter(cb => cb !== callback);
		};
	}

	/**
	 * 注册连接状态变化回调
	 */
	onStateChange(callback: ConnectionStateCallback): () => void {
		this.stateCallbacks.push(callback);
		return () => {
			this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
		};
	}

	/**
	 * 设置连接状态
	 */
	private setState(state: WSConnectionState): void {
		this._state = state;
		this.stateCallbacks.forEach(cb => cb(state));
	}

	/**
	 * 开始心跳
	 */
	private startHeartbeat(): void {
		this.stopHeartbeat();

		this.heartbeatTimer = setInterval(() => {
			if (this.ws && this._state === 'connected') {
				this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
			}
		}, WS_HEARTBEAT_INTERVAL);
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
	 * 安排重连
	 */
	private scheduleReconnect(): void {
		if (this.isDestroyed) return;

		this.reconnectAttempts++;
		this.setState('reconnecting');

		const delay = WS_RECONNECT_INTERVAL * this.reconnectAttempts;
		console.log(`[弹幕WS] ${delay}ms 后重连（第 ${this.reconnectAttempts}/${WS_MAX_RECONNECT_ATTEMPTS} 次）`);

		this.reconnectTimer = setTimeout(() => {
			if (!this.isDestroyed) {
				this._connect();
			}
		}, delay);
	}

	/**
	 * 断开连接
	 */
	disconnect(): void {
		this.isDestroyed = true;

		// 清理定时器
		this.stopHeartbeat();
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		// 关闭 WebSocket
		if (this.ws) {
			try {
				this.ws.close(1000, '用户主动断开');
			} catch {
				// 忽略关闭错误
			}
			this.ws = null;
		}

		this.setState('disconnected');
	}

	/**
	 * 销毁实例，释放所有资源
	 */
	destroy(): void {
		this.disconnect();
		this.danmakuCallbacks = [];
		this.onlineCountCallbacks = [];
		this.stateCallbacks = [];
	}
}

// ========== 单例管理 ==========

/** 弹幕 WebSocket 单例 */
let danmakuWSInstance: DanmakuWS | null = null;

/**
 * 获取弹幕 WebSocket 单例
 */
export function getDanmakuWS(): DanmakuWS {
	if (!danmakuWSInstance) {
		danmakuWSInstance = new DanmakuWS();
	}
	return danmakuWSInstance;
}

/**
 * 销毁弹幕 WebSocket 单例
 */
export function destroyDanmakuWS(): void {
	if (danmakuWSInstance) {
		danmakuWSInstance.destroy();
		danmakuWSInstance = null;
	}
}
