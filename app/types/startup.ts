import type Animated from 'react-native-reanimated';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

export interface LandingTarget {
	buddyRef: AnimatedRef<Animated.View>;
	sheetRef: AnimatedRef<Animated.View>;
	buddyHidden: SharedValue<boolean>;
}

export interface FeatherDrop {
	id: string;
	delay: number;
	x: number;
	y: number;
	width: number;
	sway: number;
	fall: number;
	startAngle: number;
	turn: number;
	wobble: number;
	duration: number;
}
