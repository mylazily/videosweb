<script lang="ts">
  let searchQuery = $state('');
  let inputEl = $state<HTMLInputElement>();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
  <div class="flex items-center h-12 px-3">
    <!-- 搜索框 -->
    <div class="flex-1 flex items-center h-9 px-3 bg-gray-100 rounded-full">
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        bind:this={inputEl}
        bind:value={searchQuery}
        onkeydown={handleKeyDown}
        type="text"
        placeholder="搜索"
        class="flex-1 ml-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
      />
    </div>
  </div>
</header>

<div class="h-12"></div>
