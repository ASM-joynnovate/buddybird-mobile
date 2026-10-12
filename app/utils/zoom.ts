/** 배율을 1배부터 최대 배율 사이로 제한하는 함수 */
export const clampZoom = (scale: number, maxZoom: number) => {
	'worklet';

	return Math.min(maxZoom, Math.max(1, scale));
};

/** 확대한 화면이 가장자리 밖으로 밀려나지 않도록 이동 거리를 제한하는 함수 */
export const clampOffset = (offset: number, scale: number, size: number) => {
	'worklet';

	const limit = (size * (scale - 1)) / 2;

	return Math.min(limit, Math.max(-limit, offset));
};
