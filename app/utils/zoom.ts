/** 이동 거리 제한 함수 */
export const clampOffset = (offset: number, scale: number, size: number) => {
	'worklet';

	const limit = (size * (scale - 1)) / 2;

	return Math.min(limit, Math.max(-limit, offset));
};
