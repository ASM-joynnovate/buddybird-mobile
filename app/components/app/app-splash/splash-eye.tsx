import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Ellipse, Rect } from 'react-native-svg';

import artwork from '@assets/images/splash-artwork.json';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface Props {
	offsetX: number;
	openness: SharedValue<number>;
}

export function SplashEye({ offsetX, openness }: Props) {
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
			<AnimatedRect x={54 + offsetX} width={240} rx={120} fill={artwork.eyeWhite} animatedProps={eyeWhiteProps} />
			<AnimatedEllipse cx={177 + offsetX} rx={61} fill={artwork.pupil} animatedProps={pupilProps} />
			<AnimatedEllipse cx={195.5 + offsetX} rx={18.5} fill={artwork.eyeWhite} animatedProps={glintProps} />
		</>
	);
}
