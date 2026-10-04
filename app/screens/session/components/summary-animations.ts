import { Easing, Keyframe, withSequence, withTiming } from 'react-native-reanimated';

/** 목표를 조금 지나쳤다가 돌아오는 속도 곡선 */
export const bounceEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

/** 빠르게 출발해 부드럽게 멈추는 속도 곡선 */
export const burstEasing = Easing.bezier(0.16, 1, 0.3, 1);

/** 작게 시작해 커지며 나타나는 애니메이션 */
export const popIn = () => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ scale: 0.4 }] },
		60: { opacity: 1, easing: bounceEasing },
		100: { opacity: 1, transform: [{ scale: 1 }], easing: bounceEasing },
	}).duration(500);
};

/** 아래에서 떠오르며 나타나는 애니메이션 */
export const riseIn = () => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateY: 16 }, { scale: 0.92 }] },
		100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: bounceEasing },
	}).duration(450);
};

/** 빛줄기가 왼쪽 밖에서 오른쪽 밖까지 한 번 지나가는 애니메이션 */
export const glintSweep = () => {
	'worklet';

	return withTiming(1, { duration: 550, easing: burstEasing });
};

/** 한 번 커졌다가 돌아오는 크기 애니메이션 */
export const bumpScale = () => {
	'worklet';

	return withSequence(
		withTiming(1.14, { duration: 175, easing: bounceEasing }),
		withTiming(1, { duration: 175, easing: bounceEasing }),
	);
};
