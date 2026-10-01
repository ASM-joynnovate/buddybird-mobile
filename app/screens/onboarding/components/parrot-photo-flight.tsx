import { type ReactNode, useEffect, useRef } from 'react';

import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BirdIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
	type AnimatedStyle,
	Easing,
	interpolate,
	type MeasuredDimensions,
	measure,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { colors, radius } from '@/theme';

const OPEN_MS = 300;
const CLOSE_MS = 240;
const BADGE_SHOW_MS = 140;
const BADGE_HIDE_MS = 100;
const BADGE_START_SCALE = 0.6;

/** 천천히 출발해 가운데에서 빨라지고 부드럽게 멈추는 속도 곡선 */
const flightEasing = Easing.bezier(0.45, 0, 0.25, 1);

export interface ParrotPhotoFlightStyles {
	photoStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	badgeStyle: StyleProp<AnimatedStyle<ViewStyle>>;
}

interface Props {
	origin: MeasuredDimensions;
	tilt: number;
	targetRef: AnimatedRef<Animated.View>;
	photoUri: string | null;
	children: (styles: ParrotPhotoFlightStyles) => ReactNode;
}

/**
 * 앵무새 카드 사진이 수정 화면의 원형 사진 자리로 옮겨 가며 화면이 나타나고, 닫을 때는 사진이 카드로 돌아가는 컴포넌트
 * @param origin 카드 사진의 화면 위치
 * @param tilt 카드 기울기 각도
 * @param targetRef 수정 화면 원형 사진의 ref
 * @param photoUri 옮겨 갈 사진 주소
 * @param children 원형 사진과 연필 버튼 스타일을 받아 수정 화면 내용을 그리는 함수
 */
const ParrotPhotoFlight = ({ origin, tilt, targetRef, photoUri, children }: Props) => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const progress = useSharedValue(0);
	const target = useSharedValue<MeasuredDimensions | null>(null);
	const flying = useSharedValue(false);
	const badgeShown = useSharedValue(0);
	const closing = useRef(false);

	// 기울어진 카드 사진은 measure가 기울기를 포함한 바깥 상자를 돌려주므로 실제 사진 한 변으로 되돌림
	const tiltRadians = (Math.abs(tilt) * Math.PI) / 180;
	const originSide = origin.width / (Math.cos(tiltRadians) + Math.sin(tiltRadians));

	const contentStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

	// 사진이 도착한 뒤 커지며 나타나고, 사진이 돌아가기 전에 작아지며 사라지는 연필 버튼
	const badgeStyle = useAnimatedStyle(() => ({
		opacity: badgeShown.get(),
		transform: [{ scale: interpolate(badgeShown.get(), [0, 1], [BADGE_START_SCALE, 1]) }],
	}));

	// 사진이 옮겨 가는 동안 수정 화면의 원형 사진을 비워 둠
	const targetPhotoStyle = useAnimatedStyle(() => ({ opacity: flying.get() ? 0 : 1 }));

	// 화면이 열린 직후 배치가 한 번 더 바뀌므로 원 위치는 프레임마다 다시 잼
	const flyingPhotoStyle = useAnimatedStyle(() => {
		if (!flying.get()) {
			return { opacity: 0 };
		}

		const to = measure(targetRef) ?? target.get();

		if (!to) {
			return { opacity: 0 };
		}

		// 카드와 같은 기울기에서 출발하도록 사진 가운데를 기준으로 옮기고 돌림
		const scale = interpolate(progress.get(), [0, 1], [originSide / to.width, 1]);
		const centerX = interpolate(progress.get(), [0, 1], [origin.pageX + origin.width / 2, to.pageX + to.width / 2]);
		const centerY = interpolate(
			progress.get(),
			[0, 1],
			[origin.pageY + origin.height / 2, to.pageY + to.height / 2],
		);

		return {
			opacity: 1,
			width: to.width,
			height: to.height,
			borderRadius: interpolate(progress.get(), [0, 1], [radius.control, to.width / 2]) / scale,
			transform: [
				{ translateX: centerX - to.width / 2 },
				{ translateY: centerY - to.height / 2 },
				{ rotate: `${interpolate(progress.get(), [0, 1], [tilt, 0])}deg` },
				{ scale },
			],
		};
	});

	/** 그려진 뒤 카드 사진 자리에서 원형 사진 자리로 사진을 옮기며 화면 보이기 */
	useEffect(() => {
		scheduleOnUI(() => {
			'worklet';

			const to = measure(targetRef);

			if (!to) {
				progress.set(withTiming(1, { duration: OPEN_MS }));
				badgeShown.set(1);

				return;
			}

			target.set(to);
			flying.set(true);
			progress.set(
				withTiming(1, { duration: OPEN_MS, easing: flightEasing }, (finished) => {
					if (finished) {
						flying.set(false);
						badgeShown.set(withTiming(1, { duration: BADGE_SHOW_MS, easing: flightEasing }));
					}
				}),
			);
		});
	}, [badgeShown, flying, progress, target, targetRef]);

	/** 닫을 때 연필 버튼을 먼저 숨기고, 사진을 카드 자리로 돌려보낸 뒤 화면 닫기 */
	useEffect(() => {
		return navigation.addListener('beforeRemove', (event) => {
			if (closing.current) {
				return;
			}

			event.preventDefault();
			closing.current = true;

			const leave = () => navigation.dispatch(event.data.action);

			scheduleOnUI(() => {
				'worklet';

				badgeShown.set(
					withTiming(0, { duration: BADGE_HIDE_MS }, () => {
						const to = measure(targetRef);

						if (to) {
							target.set(to);
							flying.set(true);
						}

						progress.set(
							withTiming(0, { duration: CLOSE_MS, easing: flightEasing }, (finished) => {
								if (finished) {
									scheduleOnRN(leave);
								}
							}),
						);
					}),
				);
			});
		});
	}, [badgeShown, flying, navigation, progress, target, targetRef]);

	return (
		<View style={styles.container}>
			<Animated.View style={[styles.container, contentStyle]}>
				{children({ photoStyle: targetPhotoStyle, badgeStyle })}
			</Animated.View>

			<Animated.View
				pointerEvents="none"
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={[styles.flying, styles.photo, flyingPhotoStyle]}
			>
				{photoUri ? (
					<Image source={{ uri: photoUri }} style={styles.image} accessibilityIgnoresInvertColors />
				) : (
					<BirdIcon size={40} color={colors.subtle} />
				)}
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	flying: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
	photo: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
	image: { width: '100%', height: '100%' },
});

export default ParrotPhotoFlight;
