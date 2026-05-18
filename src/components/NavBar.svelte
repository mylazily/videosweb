<script lang="ts">
  import { page } from '$app/state';

  const navs = [
    {
      path: '/',
      label: '首页',
      icon: 'home'
    },
    {
      path: '/short',
      label: '短视频',
      icon: 'video'
    },
    {
      path: '/discover',
      label: '发现',
      icon: 'compass'
    },
    {
      path: '/category',
      label: '分类',
      icon: 'grid'
    },
    {
      path: '/profile',
      label: '我的',
      icon: 'user'
    }
  ] as const;

  const current = $derived(page.url.pathname);
</script>

<nav class="tab-bar">
  <div class="tab-bar-inner">
    {#each navs as nav}
      {@const isActive = nav.path === '/' ? current === '/' : current.startsWith(nav.path)}
      <a
        href={nav.path}
        class="tab-item {isActive ? 'active' : ''}"
        aria-current={isActive ? 'page' : undefined}
      >
        <span class="tab-icon">
          {#if nav.icon === 'home'}
            <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isActive ? '0' : '1.8'}>
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if nav.icon === 'video'}
            <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isActive ? '0' : '1.8'}>
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if nav.icon === 'compass'}
            <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isActive ? '0' : '1.8'}>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3v18m0-18l3.5 7H8.5L12 3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if nav.icon === 'grid'}
            <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isActive ? '0' : '1.8'}>
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if nav.icon === 'user'}
            <svg viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={isActive ? '0' : '1.8'}>
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </span>
        <span class="tab-label">{nav.label}</span>
      </a>
    {/each}
  </div>
</nav>

<div class="tab-bar-spacer"></div>

<style>
  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--surface, #fff);
    border-top: 0.5px solid var(--divider, #e8e8e8);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .tab-bar-inner {
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    max-width: 600px;
    margin: 0 auto;
    height: 50px;
  }

  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 2px;
    text-decoration: none;
    color: var(--text-tertiary, #999);
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
    padding: 4px 0;
  }

  .tab-item:active {
    opacity: 0.7;
  }

  .tab-item.active {
    color: var(--primary, #FB7299);
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  .tab-icon :global(svg) {
    width: 22px;
    height: 22px;
  }

  .tab-label {
    font-size: 10px;
    line-height: 1;
    font-weight: 500;
  }

  .tab-bar-spacer {
    height: calc(50px + env(safe-area-inset-bottom, 0px));
  }
</style>
