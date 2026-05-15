# XVideos 影视聚合系统前端

> 高仿 B 站移动端 PWA，基于 SvelteKit 2 + Svelte 5 + TailwindCSS 4 + hls.js

## 技术栈

- **框架**: SvelteKit 2.53.4 + Svelte 5.53.x
- **样式**: TailwindCSS 4 + B站粉色主题
- **播放器**: hls.js (HLS 流媒体)
- **PWA**: Service Worker + 离线骨架屏
- **类型**: TypeScript 5.x
- **部署**: adapter-static 静态预渲染

## 功能特性

- 首页轮播 + 分类 + 热门 + 最新
- HLS 视频播放 + 弹幕系统
- 搜索 + 分类筛选 + 排行榜
- 播放线路切换 + 选集列表
- 观看历史 + 个人中心
- JWT 登录/注册
- API 域名动态探活切换
- XOR 解密 m3u8 链接
- 离线骨架屏 + PWA 安装
- 深色模式支持
- 下拉刷新 + 无限滚动

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 项目结构

```
src/
├── routes/          # 页面路由
├── lib/             # 工具库（API、加密、类型等）
└── components/      # UI 组件
```

## 主题色

- 主色: `#FB7299` (B站粉)
- 深色背景: `#17181A`
- 支持亮色/深色模式切换
