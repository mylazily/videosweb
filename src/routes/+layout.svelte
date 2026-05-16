<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		// 延迟加载非关键模块，不阻塞首屏渲染
		import('$lib/apiConfig').then(({ checkAndActiveApi }) => {
			checkAndActiveApi().catch(() => {});
		});
	});
</script>

{@render children()}
