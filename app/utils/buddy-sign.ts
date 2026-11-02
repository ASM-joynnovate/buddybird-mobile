/** 팻말 낙하 바운스 진행률 계산 함수 */
export const signDropProgress = (seconds: number) => {
	'worklet';

	return seconds <= 0 ? 0 : 1 - Math.exp(-8 * seconds) * Math.cos(12 * seconds);
};
