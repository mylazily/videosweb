import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// 预处理
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: true,
			strict: true
		}),
		// 预渲染配置：仅预渲染静态页面
		prerender: {
			entries: [
				'/'
			]
		},
		alias: {
			$components: 'src/components'
		}
	}
};

export default config;
