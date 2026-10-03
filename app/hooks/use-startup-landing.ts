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

/** 앱 시작 화면의 버디가 옮겨 올 목적지를 등록하는 Hook */
const useStartupLanding = () => {
	const navigation = useContext(NavigationContext);

	const buddyRef = useAnimatedRef<Animated.View>();
	const sheetRef = useAnimatedRef<Animated.View>();

	const buddyHidden = useSharedValue(false);
	const bubbleShown = useSharedValue(1);

	const setLandingTarget = useAppStore((state) => state.setLandingTarget);

	const buddyStyle = useAnimatedStyle(() => ({ opacity: buddyHidden.get() ? 0 : 1 }));
	const bubbleStyle = useAnimatedStyle(() => ({
		opacity: bubbleShown.get(),
		transform: [
			{ translateX: interpolate(bubbleShown.get(), [0, 1], [BUBBLE_START_X, 0]) },
			{ scale: interpolate(bubbleShown.get(), [0, 1], [BUBBLE_START_SCALE, 1]) },
		],
	}));

	/** 버디가 옮겨 오는 동안 말풍선을 숨기고 도착하면 표시 */
	useAnimatedReaction(
		() => buddyHidden.get(),
		(hidden, previousHidden) => {
			if (hidden) {
				bubbleShown.set(0);
			} else if (previousHidden) {
				bubbleShown.set(withTiming(1, { duration: BUBBLE_SHOW_MS, easing: Easing.out(Easing.cubic) }));
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
