<script lang="ts">
  let searchQuery = $state('');
  let inputEl = $state<HTMLInputElement>();
  let focused = $state(false);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  // 快捷键聚焦搜索框 (Cmd/Ctrl + K)
  function handleGlobalKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputEl?.focus();
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 safe-top">
  <div class="flex items-center h-12 px-3">
    <!-- 整行搜索框 -->
    <div 
      class="flex-1 flex items-center h-9 px-3 bg-gray-100/80 rounded-full transition-all duration-200 {focused ? 'ring-2 ring-[#FF6B9D]/30 bg-gray-100' : ''}"
    >
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        bind:this={inputEl}
        bind:value={searchQuery}
        onkeydown={handleKeyDown}
        onfocus={() => focused = true}
        onblur={() => focused = false}
        type="text"
        placeholder="搜索影视..."
        autocomplete="off"
        class="flex-1 ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
      />
      <!-- 快捷键提示 -->
      <kbd class="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-200/50 rounded border border-gray-200/50">
        ⌘K
      </kbd>
    </div>
  </div>
</header>

<!-- 占位 -->
<div class="h-12"></div>
