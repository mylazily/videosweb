<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		// 延迟加载非关键模块
		const { checkAndActiveApi } = await import('$lib/apiConfig');
		checkAndActiveApi().catch(() => {});
	});
</script>

{@render children()}
