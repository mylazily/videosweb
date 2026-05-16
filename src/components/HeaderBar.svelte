<script lang="ts">
  /**
   * 沉浸式顶部导航 - App风格
   */
  interface Props {
    title?: string;
    transparent?: boolean;
  }

  let { title = '影视', transparent = false }: Props = $props();
</script>

<header 
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md'}"
  style="padding-top: var(--safe-top);"
>
  <div class="flex items-center justify-between h-12 px-4">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] flex items-center justify-center shadow-sm">
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <span class="text-lg font-bold text-[var(--text-primary)]">{title}</span>
    </div>

    <!-- 搜索 -->
    <a 
      href="/search" 
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--divider)] press"
    >
      <svg class="w-5 h-5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    </a>
  </div>
</header>

<!-- 占位 -->
<div class="h-12" style="margin-top: var(--safe-top);"></div>
