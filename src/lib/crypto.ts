/**
 * XOR 解密工具
 * 与后端 middleware/crypto.go 对应
 * Base64 解码 -> XOR 解密 -> 还原原始 m3u8 URL
 */

import { XOR_KEY } from './constants';

/**
 * XOR 解密函数
 * 将加密的字符串与密钥逐字符异或
 * @param encrypted 加密后的字符串
 * @param key XOR 密钥
 * @returns 解密后的字符串
 */
function xorDecrypt(encrypted: string, key: string): string {
	let result = '';
	for (let i = 0; i < encrypted.length; i++) {
		const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
		result += String.fromCharCode(charCode);
	}
	return result;
}

/**
 * 解密 m3u8 播放地址
 * 流程：Base64 解码 -> XOR 解密 -> 还原原始 URL
 * @param encryptedUrl 加密后的 m3u8 链接（Base64 编码）
 * @returns 解密后的原始 m3u8 URL
 */
export function decryptPlayUrl(encryptedUrl: string): string {
	try {
		// 1. Base64 解码
		const decoded = atob(encryptedUrl.trim());

		// 2. XOR 解密
		const decrypted = xorDecrypt(decoded, XOR_KEY);

		// 3. 返回原始 URL
		return decrypted;
	} catch (error) {
		console.error('[Crypto] 解密失败:', error);
		// 解密失败时返回原始字符串（可能未加密）
		return encryptedUrl;
	}
}

/**
 * 加密 URL（用于测试）
 * 流程：XOR 加密 -> Base64 编码
 * @param url 原始 URL
 * @returns 加密后的字符串
 */
export function encryptUrl(url: string): string {
	try {
		const encrypted = xorDecrypt(url, XOR_KEY);
		return btoa(encrypted);
	} catch (error) {
		console.error('[Crypto] 加密失败:', error);
		return url;
	}
}
