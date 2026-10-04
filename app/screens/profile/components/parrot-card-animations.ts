import { Easing, Keyframe } from 'react-native-reanimated';

const DROP_MS = 320;
const DROP_STAGGER_MS = 40;
const DROP_STAGGER_LIMIT = 4;
const DROP_HEIGHT = 20;
const DROP_EXTRA_TILT = 5;
const SETTLE_TILT = 0.6;

/** 빠르게 떨어져 부드럽게 멈추는 속도 곡선 */
const dropEasing = Easing.bezier(0.3, 0.7, 0.3, 1);

/**
 * 카드가 위에서 더 기운 채 떨어져 제 각도로 자리 잡는 애니메이션
 * @param tilt 카드가 놓일 기울기 각도
 * @param order 카드 순서
 */
export const dropIn = (tilt: number, order: number) => {
	const direction = Math.sign(tilt) || 1;

	return new Keyframe({
		0: {
			opacity: 0,
			transform: [{ translateY: -DROP_HEIGHT }, { rotate: `${tilt + DROP_EXTRA_TILT * direction}deg` }],
		},
		75: {
			opacity: 1,
			transform: [{ translateY: 2 }, { rotate: `${tilt - SETTLE_TILT * direction}deg` }],
			easing: dropEasing,
		},
		100: {
			opacity: 1,
			transform: [{ translateY: 0 }, { rotate: `${tilt}deg` }],
			easing: dropEasing,
		},
	})
		.duration(DROP_MS)
		.delay(Math.min(order, DROP_STAGGER_LIMIT) * DROP_STAGGER_MS);
};
