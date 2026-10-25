import { useContext, useEffect } from 'react';

import { NavigationContext } from '@react-navigation/native';
import type Animated from 'react-native-reanimated';
import {
	Easing,
	interpolate,
	useAnimatedReaction,
	useAnimatedRef,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { useAppStore } from '@/stores/app';

const BUBBLE_SHOW_MS = 300;
const BUBBLE_START_X = -8;
const BUBBLE_START_SCALE = 0.94;

/** 시작 화면 버디의 목적지 등록 Hook */
const useStartupLanding = () => {
	const navigation = useContext(NavigationContext);

	const buddyRef = useAnimatedRef<Animated.View>();
	const sheetRef = useAnimatedRef<Animated.View>();

	const buddyHidden = useSharedValue(false);
	const bubbleProgress = useSharedValue(1);

	const setLandingTarget = useAppStore((state) => state.setLandingTarget);

	const buddyStyle = useAnimatedStyle(() => ({ opacity: buddyHidden.get() ? 0 : 1 }));
	const bubbleStyle = useAnimatedStyle(() => ({
		opacity: bubbleProgress.get(),
		transform: [
			{ translateX: interpolate(bubbleProgress.get(), [0, 1], [BUBBLE_START_X, 0]) },
			{ scale: interpolate(bubbleProgress.get(), [0, 1], [BUBBLE_START_SCALE, 1]) },
		],
	}));

	/** 버디 이동 중 말풍선 숨김 */
	useAnimatedReaction(
		() => buddyHidden.get(),
		(current, previous) => {
			if (current) {
				bubbleProgress.set(0);
			} else if (previous) {
				bubbleProgress.set(withTiming(1, { duration: BUBBLE_SHOW_MS, easing: Easing.out(Easing.cubic) }));
			}
		},
	);

	/** 포커스된 화면이면 목적지로 등록 */
	useEffect(() => {
		if (navigation && !navigation.isFocused()) {
			return;
		}

		const landingTarget = { buddyRef, sheetRef, buddyHidden };

		setLandingTarget(landingTarget);

		return () => {
			if (useAppStore.getState().landingTarget === landingTarget) {
				setLandingTarget(null);
			}
		};
	}, [buddyHidden, buddyRef, navigation, setLandingTarget, sheetRef]);

	return { buddyRef, sheetRef, buddyStyle, bubbleStyle };
};

export default useStartupLanding;
