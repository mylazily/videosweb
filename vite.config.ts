import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true
	},
	build: {
		// 代码分割优化
		rollupOptions: {
			output: {
				// 手动分块策略
				manualChunks: (id) => {
					// 播放器相关代码单独打包（非首屏）
					if (id.includes('hls.js') || id.includes('p2p-media-loader')) {
						return 'player';
					}
					// 工具库单独打包
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				},
				// 控制 chunk 大小
				chunkSizeWarningLimit: 500
			}
		},
		// 压缩优化
		minify: 'esbuild',
		target: 'es2020',
		// 源码映射（生产环境关闭）
		sourcemap: false
	},
	// 预构建优化
	optimizeDeps: {
		exclude: ['hls.js', 'p2p-media-loader-core', 'p2p-media-loader-hlsjs']
	}
});
