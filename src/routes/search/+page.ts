/**
 * 搜索页数据加载
 */
import type { HotWord, SearchResult } from '$lib/types';

const mockHotWords: HotWord[] = [
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

export async function load() {
	return {
		hotWords: mockHotWords
	};
}
