import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		host: true
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					// P2P/播放器相关 - 完全隔离
					if (id.includes('hls.js') || id.includes('p2p-media-loader') || id.includes('bittorrent') || id.includes('simple-websocket') || id.includes('wrtc') || id.includes('webtorrent')) {
						return 'player-vendor';
					}
				}
			}
		}
	},
	ssr: {
		// SSR时不处理这些模块
		noExternal: []
	}
});
