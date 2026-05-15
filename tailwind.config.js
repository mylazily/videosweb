/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}', './app.html'],
	theme: {
		extend: {
			colors: {
				// B站粉色主题
				'bilibili': '#FB7299',
				'bilibili-dark': '#E45580',
				'bilibili-light': '#FCAFC6',
				// 深色模式背景
				'dark-bg': '#17181A',
				'dark-card': '#222325',
				'dark-border': '#2E2F31',
				'dark-text': '#E6E6E6',
				'dark-text-secondary': '#999999'
			}
		}
	},
	darkMode: 'class',
	plugins: []
};
