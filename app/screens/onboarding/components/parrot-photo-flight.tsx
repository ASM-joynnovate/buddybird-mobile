import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Image, type StyleProp, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BirdIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
	type AnimatedStyle,
	Easing,
	interpolate,
	interpolateColor,
	type MeasuredDimensions,
	measure,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import ParrotPhotoPlaceholder from '@/screens/onboarding/components/parrot-photo-placeholder';
import { colors, radius } from '@/theme';

const OPEN_MS = 300;
const CLOSE_MS = 240;
const SHEET_OPEN_MS = 520;
const SHEET_OPEN_DELAY_MS = 90;
const BUTTONS_SHOW_MS = 140;
const BUTTONS_HIDE_MS = 100;
const BUTTONS_START_SCALE = 0.6;

/** 천천히 출발해 가운데에서 빨라지고 부드럽게 멈추는 속도 곡선 */
const flightEasing = Easing.bezier(0.45, 0, 0.25, 1);

/** 시트가 올라올 때의 속도 곡선 */
const sheetOpenEasing = Easing.bezier(0.16, 1, 0.3, 1);

/** 시트가 내려갈 때의 속도 곡선 */
const sheetCloseEasing = Easing.bezier(0.4, 0, 1, 1);

export interface ParrotPhotoFlightParts {
	photoStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	buttonsStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	sheetStyle: StyleProp<AnimatedStyle<ViewStyle>>;
	flyingPhoto: ReactNode;
	photoLanded: boolean;
}

interface Props {
	origin: MeasuredDimensions;
	tilt: number;
	targetRef: AnimatedRef<Animated.View>;
	photoUri: string | null;
	children: (parts: ParrotPhotoFlightParts) => ReactNode;
}

/**
 * 앵무새 카드 사진이 수정 화면의 사진 자리로 옮겨 가는 컴포넌트
 * @param origin 카드 사진의 화면 위치
 * @param tilt 카드 기울기 각도
 * @param targetRef 수정 화면 사진의 ref
 * @param photoUri 옮겨 갈 사진 주소
 * @param children 수정 화면을 그리는 함수
 */
const ParrotPhotoFlight = ({ origin, tilt, targetRef, photoUri, children }: Props) => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { height: windowHeight } = useWindowDimensions();

	const [photoLanded, setPhotoLanded] = useState(false);

	const progress = useSharedValue(0);
	const target = useSharedValue<MeasuredDimensions | null>(null);
	const flying = useSharedValue(false);
	const sheetShown = useSharedValue(0);
	const buttonsShown = useSharedValue(0);
	const closing = useRef(false);

	// 기울어진 카드 사진은 measure가 기울기를 포함한 바깥 상자를 돌려주므로 실제 사진 한 변으로 되돌림
	const tiltRadians = (Math.abs(tilt) * Math.PI) / 180;
	const originSide = origin.width / (Math.cos(tiltRadians) + Math.sin(tiltRadians));

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: interpolate(sheetShown.get(), [0, 1], [windowHeight, 0]) }],
	}));

	const buttonsStyle = useAnimatedStyle(() => ({
		opacity: buttonsShown.get(),
		transform: [{ scale: interpolate(buttonsShown.get(), [0, 1], [BUTTONS_START_SCALE, 1]) }],
	}));

	// 사진이 옮겨 가는 동안 수정 화면의 사진을 비워 둠
	const targetPhotoStyle = useAnimatedStyle(() => ({ opacity: flying.get() ? 0 : 1 }));

	// 화면이 열린 직후 배치가 한 번 더 바뀌므로 사진 위치는 프레임마다 다시 잼
	const flyingPhotoStyle = useAnimatedStyle(() => {
		if (!flying.get()) {
			return { opacity: 0 };
		}

		const to = measure(targetRef) ?? target.get();

		if (!to) {
			return { opacity: 0 };
		}

		const width = interpolate(progress.get(), [0, 1], [originSide, to.width]);
		const height = interpolate(progress.get(), [0, 1], [originSide, to.height]);
		const centerX = interpolate(progress.get(), [0, 1], [origin.pageX + origin.width / 2, to.pageX + to.width / 2]);
		const centerY = interpolate(
			progress.get(),
			[0, 1],
			[origin.pageY + origin.height / 2, to.pageY + to.height / 2],
		);

		return {
			opacity: 1,
			width,
			height,
			borderRadius: interpolate(progress.get(), [0, 1], [radius.control, 0]),
			backgroundColor: photoUri
				? colors.surface
				: interpolateColor(progress.get(), [0, 1], [colors.surface, colors.orangePale]),
			transform: [
				{ translateX: centerX - width / 2 },
				{ translateY: centerY - height / 2 },
				{ rotate: `${interpolate(progress.get(), [0, 1], [tilt, 0])}deg` },
			],
		};
	});

	// 사진이 없을 때 카드 아이콘을 사진 추가 문구로 바꿈
	const cardPlaceholderStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
	const editorPlaceholderStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

	/** 화면이 열릴 때 사진을 옮기고 시트를 올림 */
	useEffect(() => {
		scheduleOnUI(() => {
			'worklet';

			sheetShown.set(
				withDelay(SHEET_OPEN_DELAY_MS, withTiming(1, { duration: SHEET_OPEN_MS, easing: sheetOpenEasing })),
			);

			const to = measure(targetRef);

			if (!to) {
				buttonsShown.set(1);
				scheduleOnRN(setPhotoLanded, true);

				return;
			}

			target.set(to);
			flying.set(true);
			progress.set(
				withTiming(1, { duration: OPEN_MS, easing: flightEasing }, (finished) => {
					if (finished) {
						flying.set(false);
						buttonsShown.set(withTiming(1, { duration: BUTTONS_SHOW_MS, easing: flightEasing }));
						scheduleOnRN(setPhotoLanded, true);
					}
				}),
			);
		});
	}, [buttonsShown, flying, progress, sheetShown, target, targetRef]);

	/** 닫을 때 사진을 카드 자리로 돌려보낸 뒤 화면 닫기 */
	useEffect(() => {
		return navigation.addListener('beforeRemove', (event) => {
			if (closing.current) {
				return;
			}

			event.preventDefault();
			closing.current = true;

			setPhotoLanded(false);

			const leave = () => navigation.dispatch(event.data.action);

			scheduleOnUI(() => {
				'worklet';

				buttonsShown.set(
					withTiming(0, { duration: BUTTONS_HIDE_MS }, () => {
						const to = measure(targetRef);

						if (to) {
							target.set(to);
							flying.set(true);
						}

						sheetShown.set(withTiming(0, { duration: CLOSE_MS, easing: sheetCloseEasing }));
						progress.set(
							withDelay(
								CLOSE_MS / 2,
								withTiming(0, { duration: CLOSE_MS, easing: flightEasing }, (finished) => {
									if (finished) {
										scheduleOnRN(leave);
									}
								}),
							),
						);
					}),
				);
			});
		});
	}, [buttonsShown, flying, navigation, progress, sheetShown, target, targetRef]);

	const flyingPhoto = (
		<Animated.View
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[styles.flying, flyingPhotoStyle]}
		>
			{photoUri ? (
				<Image source={{ uri: photoUri }} style={styles.image} accessibilityIgnoresInvertColors />
			) : (
				<>
					<Animated.View style={[styles.placeholder, cardPlaceholderStyle]}>
						<BirdIcon size={40} color={colors.subtle} />
					</Animated.View>
					<Animated.View style={[styles.placeholder, editorPlaceholderStyle]}>
						<ParrotPhotoPlaceholder />
					</Animated.View>
				</>
			)}
		</Animated.View>
	);

	return children({
		photoStyle: targetPhotoStyle,
		buttonsStyle,
		sheetStyle,
		flyingPhoto,
		photoLanded,
	});
};

const styles = StyleSheet.create({
	flying: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
	image: { width: '100%', height: '100%' },
	placeholder: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

export default ParrotPhotoFlight;
