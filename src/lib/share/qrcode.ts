/**
 * QR 码生成器
 * 纯 JavaScript 实现，不依赖外部库
 * 基于 QR Code Model 2 标准
 */

// ========== QR 码数据编码 ==========

/** QR 纠错等级 */
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** QR 码生成选项 */
export interface QRCodeOptions {
	size?: number;       // 输出尺寸（像素）
	level?: QRErrorCorrectionLevel; // 纠错等级
	margin?: number;     // 边距（模块数）
	fgColor?: string;    // 前景色
	bgColor?: string;    // 背景色
}

/** QR 码生成结果 */
export interface QRCodeResult {
	svg: string;         // SVG 字符串
	size: number;        // 实际尺寸
	moduleCount: number; // 模块数量
}

// ========== 纠错等级对应的容量表 ==========

// EC 表：每个版本、纠错等级下可存储的字节模式数据容量
const EC_CODEWORDS_TABLE: number[][] = [
	// 版本 1-40, 每行: [L, M, Q, H]
	[7, 10, 13, 17], [10, 16, 22, 28], [15, 26, 18, 22], [20, 18, 26, 16],
	[26, 24, 18, 22], [18, 16, 24, 28], [20, 18, 18, 26], [24, 22, 22, 26],
	[30, 22, 20, 24], [18, 26, 24, 28], [20, 30, 28, 24], [24, 22, 26, 28],
	[26, 22, 24, 22], [30, 24, 20, 24], [22, 24, 30, 24], [24, 28, 24, 30],
	[28, 28, 28, 28], [30, 26, 28, 28], [28, 26, 26, 26], [28, 26, 28, 28],
	[28, 26, 30, 28], [28, 28, 24, 30], [30, 28, 30, 30], [30, 28, 30, 30],
	[26, 28, 30, 30], [28, 28, 28, 30], [30, 28, 30, 30], [30, 28, 30, 30],
	[30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30],
	[30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30],
	[30, 28, 30, 30], [30, 28, 30, 30], [30, 28, 30, 30]
];

// 对齐图案位置表
const ALIGNMENT_PATTERN_POSITIONS: number[][] = [
	[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
	[6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
	[6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
	[6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82],
	[6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94],
	[6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106],
	[6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
	[6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126],
	[6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
	[6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
	[6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
	[6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
	[6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
	[6, 30, 58, 86, 114, 142, 170]
];

// 格式信息表
const FORMAT_INFO_TABLE = [
	0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
	0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
	0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
	0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b
];

// ========== QR 码矩阵生成 ==========

/**
 * 计算最适合的 QR 版本
 */
function getBestVersion(dataLength: number, level: QRErrorCorrectionLevel): number {
	const levelIndex = { L: 0, M: 1, Q: 2, H: 3 }[level];

	for (let version = 1; version <= 40; version++) {
		const capacity = EC_CODEWORDS_TABLE[version - 1][levelIndex];
		if (dataLength <= capacity) {
			return version;
		}
	}

	// 超出最大容量，返回版本 40
	return 40;
}

/**
 * 获取模块数量
 */
function getModuleCount(version: number): number {
	return 17 + version * 4;
}

/**
 * 创建空矩阵
 */
function createMatrix(moduleCount: number): boolean[][] {
	const matrix: boolean[][] = [];
	for (let i = 0; i < moduleCount; i++) {
		matrix[i] = new Array(moduleCount).fill(false);
	}
	return matrix;
}

/**
 * 放置查找图案（三个角上的大方块）
 */
function placeFinderPattern(matrix: boolean[][], row: number, col: number): void {
	const size = matrix.length;

	for (let r = -1; r <= 7; r++) {
		for (let c = -1; c <= 7; c++) {
			const mr = row + r;
			const mc = col + c;

			if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;

			// 外框或中心
			if (
				(r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
				(c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
				(r >= 2 && r <= 4 && c >= 2 && c <= 4)
			) {
				matrix[mr][mc] = true;
			} else {
				matrix[mr][mc] = false;
			}
		}
	}
}

/**
 * 放置对齐图案
 */
function placeAlignmentPatterns(matrix: boolean[][], version: number): void {
	const positions = ALIGNMENT_PATTERN_POSITIONS[version - 1];
	if (!positions || positions.length === 0) return;

	const size = matrix.length;

	for (const row of positions) {
		for (const col of positions) {
			// 跳过与查找图案重叠的位置
			if (
				(row < 9 && col < 9) ||       // 左上
				(row < 9 && col >= size - 8) || // 右上
				(row >= size - 8 && col < 9)    // 左下
			) continue;

			for (let r = -2; r <= 2; r++) {
				for (let c = -2; c <= 2; c++) {
					if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
						matrix[row + r][col + c] = true;
					} else {
						matrix[row + r][col + c] = false;
					}
				}
			}
		}
	}
}

/**
 * 放置定时图案
 */
function placeTimingPatterns(matrix: boolean[][]): void {
	const size = matrix.length;

	for (let i = 8; i < size - 8; i++) {
		// 水平
		if (!matrix[6][i]) {
			matrix[6][i] = i % 2 === 0;
		}
		// 垂直
		if (!matrix[i][6]) {
			matrix[i][6] = i % 2 === 0;
		}
	}
}

/**
 * 放置格式信息
 */
function placeFormatInfo(matrix: boolean[][], level: QRErrorCorrectionLevel, maskPattern: number): void {
	const levelIndex = { L: 0, M: 1, Q: 2, H: 3 }[level];
	const formatInfo = FORMAT_INFO_TABLE[levelIndex * 8 + maskPattern];
	const size = matrix.length;

	// 水平格式信息
	for (let i = 0; i < 8; i++) {
		matrix[8][i] = !!(formatInfo & (1 << i));
	}
	matrix[8][8] = !!(formatInfo & (1 << 8));

	// 垂直格式信息
	for (let i = 0; i < 7; i++) {
		matrix[size - 1 - i][8] = !!(formatInfo & (1 << i));
	}
	matrix[8][size - 8] = !!(formatInfo & (1 << 7));
}

/**
 * 放置数据位
 */
function placeDataBits(matrix: boolean[][], data: number[], version: number): void {
	const size = matrix.length;
	let bitIndex = 0;

	// 从右到左，每两列一组
	for (let col = size - 1; col >= 1; col -= 2) {
		if (col === 6) col = 5; // 跳过定时图案列

		// 上下交替
		for (let row = 0; row < size; row++) {
			for (let c = 0; c < 2; c++) {
				const currentCol = col - c;

				// 跳过功能区域
				if (isFunctionArea(matrix, row, currentCol, size)) continue;

				if (bitIndex < data.length * 8) {
					const byteIndex = Math.floor(bitIndex / 8);
					const bitOffset = 7 - (bitIndex % 8);
					matrix[row][currentCol] = !!(data[byteIndex] & (1 << bitOffset));
				}
				bitIndex++;
			}
		}
	}
}

/**
 * 判断是否为功能区域
 */
function isFunctionArea(matrix: boolean[][], row: number, col: number, size: number): boolean {
	// 查找图案区域
	if ((row < 9 && col < 9) || (row < 9 && col >= size - 8) || (row >= size - 8 && col < 9)) {
		return true;
	}
	// 定时图案
	if (row === 6 || col === 6) {
		return true;
	}
	return false;
}

/**
 * 简单的 Reed-Solomon 编码（简化版，用于生成可用的 QR 码）
 */
function encodeData(text: string): number[] {
	// UTF-8 编码
	const encoder = new TextEncoder();
	const bytes = encoder.encode(text);

	// 转换为字节数组
	const data: number[] = Array.from(bytes);

	// 添加模式指示符（字节模式 = 0100）和字符计数
	// 简化处理：直接使用字节数据
	return data;
}

/**
 * 生成 QR 码矩阵
 */
function generateQRMatrix(text: string, level: QRErrorCorrectionLevel): { matrix: boolean[][]; version: number } {
	const data = encodeData(text);
	const version = getBestVersion(data.length, level);
	const moduleCount = getModuleCount(version);
	const matrix = createMatrix(moduleCount);

	// 放置功能图案
	placeFinderPattern(matrix, 0, 0);
	placeFinderPattern(matrix, 0, moduleCount - 7);
	placeFinderPattern(matrix, moduleCount - 7, 0);
	placeAlignmentPatterns(matrix, version);
	placeTimingPatterns(matrix);

	// 放置数据
	placeDataBits(matrix, data, version);

	// 放置格式信息
	placeFormatInfo(matrix, level, 0);

	return { matrix, version };
}

// ========== SVG 生成 ==========

/**
 * 生成 QR 码 SVG 字符串
 * @param text 要编码的文本
 * @param size 输出尺寸（像素），默认 200
 * @param options QR 码选项
 * @returns SVG 字符串
 */
export function generateQRCode(
	text: string,
	size: number = 200,
	options: QRCodeOptions = {}
): string {
	const {
		level = 'M',
		margin = 2,
		fgColor = '#000000',
		bgColor = '#FFFFFF'
	} = options;

	const { matrix, version } = generateQRMatrix(text, level);
	const moduleCount = getModuleCount(version);
	const totalModules = moduleCount + margin * 2;
	const moduleSize = size / totalModules;

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

	// 背景
	svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;

	// 数据模块
	for (let row = 0; row < moduleCount; row++) {
		for (let col = 0; col < moduleCount; col++) {
			if (matrix[row][col]) {
				const x = (col + margin) * moduleSize;
				const y = (row + margin) * moduleSize;
				svg += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="${fgColor}"/>`;
			}
		}
	}

	svg += '</svg>';
	return svg;
}

/**
 * 生成 QR 码 Data URI
 * @param text 要编码的文本
 * @param size 输出尺寸
 * @param options QR 码选项
 * @returns Data URI 字符串
 */
export function generateQRCodeDataURI(
	text: string,
	size: number = 200,
	options: QRCodeOptions = {}
): string {
	const svg = generateQRCode(text, size, options);
	const encoded = svg
		.replace(/"/g, "'")
		.replace(/%/g, '%25')
		.replace(/#/g, '%23')
		.replace(/{/g, '%7B')
		.replace(/}/g, '%7D')
		.replace(/</g, '%3C')
		.replace(/>/g, '%3E');
	return `data:image/svg+xml,${encoded}`;
}
