import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import { Ellipse, Rect } from 'react-native-svg';

import artwork from '@assets/images/splash-artwork.json';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface Props {
	offset: number;
	openness: SharedValue<number>;
}

export function SplashEye({ offset, openness }: Props) {
	const white = useAnimatedProps(() => ({
		y: 755 - 196 * openness.get(),
		height: 392 * openness.get(),
	}));
	const pupil = useAnimatedProps(() => ({
		cy: 755 + 36.5 * openness.get(),
		ry: 73.5 * openness.get(),
	}));
	const glint = useAnimatedProps(() => ({
		cy: 755 + 6.5 * openness.get(),
		ry: 19.5 * openness.get(),
	}));

	return (
		<>
			<AnimatedRect x={54 + offset} width={240} rx={120} fill={artwork.eyeWhite} animatedProps={white} />
			<AnimatedEllipse cx={177 + offset} rx={61} fill={artwork.pupil} animatedProps={pupil} />
			<AnimatedEllipse cx={195.5 + offset} rx={18.5} fill={artwork.eyeWhite} animatedProps={glint} />
		</>
	);
}
