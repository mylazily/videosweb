import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true
	},
	build: {
		// 优化代码分割
		rollupOptions: {
			output: {
				manualChunks(id) {
					// P2P/播放器相关 - 完全隔离，按需加载
					if (id.includes('hls.js') || id.includes('p2p-media-loader') || id.includes('bittorrent') || id.includes('simple-websocket') || id.includes('wrtc') || id.includes('webtorrent')) {
						return 'player-vendor';
					}
					// 图表/可视化库
					if (id.includes('chart.js') || id.includes('echarts') || id.includes('d3')) {
						return 'charts';
					}
				}
			}
		},
		// 启用 CSS 代码分割
		cssCodeSplit: true,
		// 优化压缩
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info']
			}
		},
		// 报告压缩后大小
		reportCompressedSize: true
	},
	ssr: {
		// SSR时不处理这些模块
		noExternal: []
	},
	// 优化依赖预构建
	optimizeDeps: {
		include: ['hls.js'],
		exclude: ['p2p-media-loader-hlsjs']
	}
});
