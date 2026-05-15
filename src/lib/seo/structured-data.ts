/**
 * SEO 结构化数据生成工具
 * 生成 JSON-LD 格式的结构化数据，用于搜索引擎优化
 */

import { SITE_BASE_URL } from '$lib/constants';
import type { Video, Tag } from '$lib/types';

// ========== 视频结构化数据 ==========

/**
 * 生成视频页面的 VideoObject 结构化数据
 * @param video 视频信息
 * @returns JSON-LD 对象
 */
export function generateVideoSchema(video: Video): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'VideoObject',
		'name': video.title,
		'description': video.description,
		'thumbnailUrl': video.cover,
		'uploadDate': video.update_time,
		'duration': formatDurationISO(video.sources),
		'contentUrl': `${SITE_BASE_URL}/video/${video.id}`,
		'embedUrl': `${SITE_BASE_URL}/video/${video.id}`,
		'author': {
			'@type': 'Organization',
			'name': 'XVideos 影视'
		},
		'publisher': {
			'@type': 'Organization',
			'name': 'XVideos 影视',
			'logo': {
				'@type': 'ImageObject',
				'url': `${SITE_BASE_URL}/icons/icon-512.png`
			}
		},
		'aggregateRating': video.rating > 0 ? {
			'@type': 'AggregateRating',
			'ratingValue': (video.rating / 2).toFixed(1), // 转换为 5 分制
			'bestRating': '5',
			'worstRating': '1',
			'ratingCount': video.play_count
		} : undefined,
		'interactionStatistic': {
			'@type': 'InteractionCounter',
			'interactionType': 'https://schema.org/WatchAction',
			'userInteractionCount': video.play_count
		},
		'keywords': video.tags.join(', '),
		'inLanguage': 'zh-CN'
	};
}

// ========== 标签页结构化数据 ==========

/**
 * 生成标签页的 Article 结构化数据
 * @param tag 标签信息
 * @param videos 标签下的视频列表（可选）
 * @returns JSON-LD 对象
 */
export function generateArticleSchema(tag: Tag, videos?: Video[]): Record<string, unknown> {
	const schema: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		'name': `${tag.name} - XVideos 影视`,
		'description': tag.description || `${tag.name}分类下的影视作品合集`,
		'url': `${SITE_BASE_URL}/tags/${tag.slug}`,
		'isPartOf': {
			'@type': 'WebSite',
			'name': 'XVideos 影视',
			'url': SITE_BASE_URL
		},
		'publisher': {
			'@type': 'Organization',
			'name': 'XVideos 影视',
			'logo': {
				'@type': 'ImageObject',
				'url': `${SITE_BASE_URL}/icons/icon-512.png`
			}
		},
		'inLanguage': 'zh-CN'
	};

	// 如果有封面图
	if (tag.cover) {
		schema.image = tag.cover;
	}

	// 如果有视频列表，添加 itemList
	if (videos && videos.length > 0) {
		schema.mainEntity = {
			'@type': 'ItemList',
			'numberOfItems': videos.length,
			'itemListElement': videos.slice(0, 10).map((video, index) => ({
				'@type': 'ListItem',
				'position': index + 1,
				'item': {
					'@type': 'VideoObject',
					'name': video.title,
					'thumbnailUrl': video.cover,
					'url': `${SITE_BASE_URL}/video/${video.id}`
				}
			}))
		};
	}

	return schema;
}

// ========== 面包屑导航 ==========

/**
 * 生成面包屑导航结构化数据
 * @param path 当前路径
 * @param customItems 自定义面包屑项（可选）
 * @returns JSON-LD 对象
 */
export function generateBreadcrumbSchema(
	path: string,
	customItems?: Array<{ name: string; url: string }>
): Record<string, unknown> {
	// 默认面包屑项
	const defaultItems = buildBreadcrumbItems(path);
	const items = customItems || defaultItems;

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		'itemListElement': items.map((item, index) => ({
			'@type': 'ListItem',
			'position': index + 1,
			'name': item.name,
			'item': `${SITE_BASE_URL}${item.url}`
		}))
	};
}

// ========== 网站结构化数据 ==========

/**
 * 生成 WebSite 结构化数据（全局使用）
 * @returns JSON-LD 对象
 */
export function generateWebSiteSchema(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'name': 'XVideos 影视',
		'url': SITE_BASE_URL,
		'description': 'XVideos 影视聚合系统 - 在线观看最新电影、电视剧、动漫、综艺、短视频',
		'potentialAction': {
			'@type': 'SearchAction',
			'target': {
				'@type': 'EntryPoint',
				'urlTemplate': `${SITE_BASE_URL}/search?keyword={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		},
		'inLanguage': 'zh-CN'
	};
}

// ========== 工具函数 ==========

/**
 * 将结构化数据对象转换为 JSON-LD script 标签内容
 * @param schema 结构化数据对象
 * @returns JSON 字符串
 */
export function schemaToJsonLd(schema: Record<string, unknown>): string {
	return JSON.stringify(schema);
}

/**
 * 根据路径构建面包屑项
 */
function buildBreadcrumbItems(path: string): Array<{ name: string; url: string }> {
	const items: Array<{ name: string; url: string }> = [
		{ name: '首页', url: '/' }
	];

	const segments = path.split('/').filter(Boolean);

	if (segments.length === 0) return items;

	// 路径名称映射
	const nameMap: Record<string, string> = {
		'category': '分类',
		'tags': '标签',
		'rank': '排行榜',
		'search': '搜索',
		'history': '观看历史',
		'short': '短视频',
		'profile': '个人中心',
		'login': '登录',
		'register': '注册',
		'video': '视频详情'
	};

	let currentPath = '';
	for (const segment of segments) {
		currentPath += `/${segment}`;
		const displayName = nameMap[segment] || decodeURIComponent(segment);
		items.push({ name: displayName, url: currentPath });
	}

	return items;
}

/**
 * 格式化视频时长为 ISO 8601 格式
 */
function formatDurationISO(sources: Video['sources']): string {
	// 如果有剧集信息，估算总时长（假设每集 45 分钟）
	if (sources.length > 0 && sources[0].episodes.length > 0) {
		const episodeCount = sources[0].episodes.length;
		const totalMinutes = episodeCount * 45;
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return `PT${hours}H${minutes}M`;
	}
	// 默认 2 小时
	return 'PT2H';
}
