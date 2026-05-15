// 全局类型声明

/// <reference types="@sveltejs/kit" />

declare namespace App {
	// 接口
	interface Locals {
		userid?: string;
	}

	// 页面数据
	interface PageData {
		[key: string]: unknown;
	}

	// 页面状态
	interface PageState {
		[key: string]: unknown;
	}

	// 错误
	interface Error {
		message: string;
		code?: number;
	}
}

// 扩展 Window 接口
declare global {
	interface Window {
		// Service Worker 通信
		navigator: Navigator & {
			serviceWorker: ServiceWorkerContainer;
		};
	}
}

export {};
