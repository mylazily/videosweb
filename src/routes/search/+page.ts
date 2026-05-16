/**
 * 搜索页数据加载
 * 调用真实API获取热搜词
 */
import type { HotWord } from '$lib/types';
import { getBaseUrl } from '$lib/apiConfig';

export async function load() {
	const base = getBaseUrl();
	let hotWords: HotWord[] = [];

	try {
		const res = await fetch(`${base}/api/v1/search/hot`);
		if (res.ok) {
			const data = await res.json();
			hotWords = data.data?.words || data.data || data.hot_words || [];
		}
	} catch {
		// API调用失败时使用默认数据
	}

	// 如果API返回空，使用默认热搜词
	if (hotWords.length === 0) {
		hotWords = [
			{ word: '速度与激情10', hot: 99999 },
			{ word: '流浪地球3', hot: 88888 },
			{ word: '封神第二部', hot: 77777 },
			{ word: '热辣滚烫', hot: 66666 },
			{ word: '三体', hot: 55555 },
			{ word: '繁花', hot: 44444 },
			{ word: '狂飙', hot: 33333 },
			{ word: '漫长的季节', hot: 22222 },
			{ word: '庆余年2', hot: 11111 },
			{ word: '与凤行', hot: 9999 }
		];
	}

	return {
		hotWords
	};
}
