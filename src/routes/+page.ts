import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const { getBaseUrl } = await import('$lib/apiConfig');
    const base = getBaseUrl();
    const url = base
      ? `${base}/api/v1/videos?page=1&page_size=12`
      : '/api/v1/videos?page=1&page_size=12';
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      const data = await res.json();
      const list = data.data?.list || data.data || [];
      return {
        videos: list,
        loaded: true
      };
    }
  } catch {
    // API 调用失败，由客户端动态加载
  }

  return {
    videos: [],
    loaded: false
  };
};
