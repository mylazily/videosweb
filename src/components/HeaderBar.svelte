<script lang="ts">
  interface Props {
    title?: string;
  }
  let { title = '影视' }: Props = $props();
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
  <div class="flex items-center h-12 px-3 gap-3">
    <!-- 标题 -->
    <span class="text-base font-bold text-gray-900 flex-shrink-0">{title}</span>

    <!-- 搜索框 -->
    <a href="/search" class="flex-1 flex items-center h-8 px-3 bg-gray-100 rounded-full">
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <span class="ml-2 text-sm text-gray-400">搜索</span>
    </a>
  </div>
</header>

<div class="h-12"></div>
