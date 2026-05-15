import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true
	},
	build: {
		target: 'esnext',
		// 优化 chunk 分割策略
		rollupOptions: {
			output: {
				// 手动分割第三方依赖
				manualChunks: {
					// hls.js 单独分包（较大）
					'hls': ['hls.js'],
					// Svelte 运行时
					'svelte-vendor': ['svelte'],
					// 其他第三方库
					'vendor': []
				}
			}
		}
	},
	// 图片压缩优化
	assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp', '**/*.svg']
});
