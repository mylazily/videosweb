/**
 * 观看历史页数据加载
 */
import type { WatchHistory } from '$lib/types';

const mockHistory: WatchHistory[] = Array.from({ length: 10 }, (_, i) => ({
	id: `history_${i}`,
	video_id: `hist_video_${i}`,
	video_title: `观看过的影片 ${i + 1}`,
	video_cover: `https://picsum.photos/seed/hist${i}/400/225`,
	episode_name: `第${Math.floor(Math.random() * 24) + 1}集`,
	progress: Math.floor(Math.random() * 3600),
	duration: 3600 + Math.floor(Math.random() * 1800),
	watch_time: new Date(Date.now() - i * 86400000).toISOString()
}));

export async function load() {
	return {
		history: mockHistory
	};
}
