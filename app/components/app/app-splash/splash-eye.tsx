import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Ellipse, Rect } from 'react-native-svg';

import artwork from '@assets/images/splash-artwork.json';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface Props {
	offsetX: number;
	openness: SharedValue<number>;
}

/**
 * 스플래시 눈 컴포넌트
 * @param offsetX 왼쪽 눈에서 떨어진 가로 거리
 * @param openness 0에서 1 사이의 눈을 뜬 정도
 */
const SplashEye = ({ offsetX, openness }: Props) => {
	const eyeWhiteProps = useAnimatedProps(() => ({
		y: 755 - 196 * openness.get(),
		height: 392 * openness.get(),
	}));
	const pupilProps = useAnimatedProps(() => ({
		cy: 755 + 36.5 * openness.get(),
		ry: 73.5 * openness.get(),
	}));
	const glintProps = useAnimatedProps(() => ({
		cy: 755 + 6.5 * openness.get(),
		ry: 19.5 * openness.get(),
	}));

	return (
		<>
			{/*흰자*/}
			<AnimatedRect x={54 + offsetX} width={240} rx={120} fill={artwork.eyeWhite} animatedProps={eyeWhiteProps} />

			{/*눈동자*/}
			<AnimatedEllipse cx={177 + offsetX} rx={61} fill={artwork.pupil} animatedProps={pupilProps} />

			{/*반짝임*/}
			<AnimatedEllipse cx={195.5 + offsetX} rx={18.5} fill={artwork.eyeWhite} animatedProps={glintProps} />
		</>
	);
};

export default SplashEye;
