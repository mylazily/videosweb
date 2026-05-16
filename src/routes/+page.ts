import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  // 构建时从静态数据文件加载（GitHub Actions构建时生成）
  // 如果静态文件不存在，则返回空数组，由客户端动态加载
  try {
    // 使用相对路径，构建时如果文件不存在会报错，所以用 try-catch
    const res = await fetch('/data/hot.json');
    if (res.ok) {
      const data = await res.json();
      return {
        videos: data.data?.list || data.data || [],
        loaded: true
      };
    }
  } catch {
    // 静态文件不存在，客户端会动态加载
  }

  return {
    videos: [],
    loaded: false
  };
};

// 禁用预渲染，因为数据在构建时才拉取
// 改为客户端渲染，但数据通过 static/data 提供
export const prerender = false;
