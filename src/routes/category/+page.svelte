<script lang="ts">
  /**
   * 分类入口页
   * 重定向到默认分类（电影）
   */
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/category/movie');
  });
</script>

<div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
  <div class="w-6 h-6 border-2 border-[#FF6B9D]/30 border-t-[#FF6B9D] rounded-full animate-spin"></div>
</div>

<style>
  .animate-spin {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
