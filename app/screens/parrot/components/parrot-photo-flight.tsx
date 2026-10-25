import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Image, StyleSheet, useWindowDimensions } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';
import type { ParrotPhotoFlightParts } from '@/types/parrot-photo-flight';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BirdIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
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

import ParrotPhotoPlaceholder from '@/screens/parrot/components/parrot-photo-placeholder';
import { burstEasing, colors, radius } from '@/theme';

const OPEN_MS = 300;
const CLOSE_MS = 240;
const SHEET_OPEN_MS = 520;
const SHEET_OPEN_DELAY_MS = 90;
const BUTTONS_SHOW_MS = 140;
const BUTTONS_HIDE_MS = 100;
const BUTTONS_START_SCALE = 0.6;

const flightEasing = Easing.bezier(0.45, 0, 0.25, 1);
const sheetCloseEasing = Easing.bezier(0.4, 0, 1, 1);

interface Props {
	origin: MeasuredDimensions;
	tilt: number;
	targetRef: AnimatedRef<Animated.View>;
	photoUri: string | null;
	children: (parts: ParrotPhotoFlightParts) => ReactNode;
}

/**
 * 카드 사진을 수정 화면으로 이동하는 컴포넌트
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
	const targetLayout = useSharedValue<MeasuredDimensions | null>(null);
	const flying = useSharedValue(false);
	const sheetProgress = useSharedValue(0);
	const buttonsProgress = useSharedValue(0);

	const closingRef = useRef(false);

	// 기울어진 카드의 실제 사진 크기 계산
	const tiltRadians = (Math.abs(tilt) * Math.PI) / 180;
	const originSide = origin.width / (Math.cos(tiltRadians) + Math.sin(tiltRadians));

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: interpolate(sheetProgress.get(), [0, 1], [windowHeight, 0]) }],
	}));

	const buttonsStyle = useAnimatedStyle(() => ({
		opacity: buttonsProgress.get(),
		transform: [{ scale: interpolate(buttonsProgress.get(), [0, 1], [BUTTONS_START_SCALE, 1]) }],
	}));

	// 사진이 옮겨 가는 동안 수정 화면의 사진을 비워 둠
	const targetPhotoStyle = useAnimatedStyle(() => ({ opacity: flying.get() ? 0 : 1 }));

	// 사진 위치를 프레임마다 측정
	const flyingPhotoStyle = useAnimatedStyle(() => {
		if (!flying.get()) {
			return { opacity: 0 };
		}

		const to = measure(targetRef) ?? targetLayout.get();

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

	// 사진이 없으면 카드 아이콘을 사진 추가 문구로 전환
	const cardPlaceholderStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
	const editorPlaceholderStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

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

	/** 사진 이동 및 bottom sheet 표시 */
	useEffect(() => {
		scheduleOnUI(() => {
			'worklet';

			sheetProgress.set(
				withDelay(SHEET_OPEN_DELAY_MS, withTiming(1, { duration: SHEET_OPEN_MS, easing: burstEasing })),
			);

			const to = measure(targetRef);

			if (!to) {
				buttonsProgress.set(1);
				scheduleOnRN(setPhotoLanded, true);

				return;
			}

			targetLayout.set(to);
			flying.set(true);
			progress.set(
				withTiming(1, { duration: OPEN_MS, easing: flightEasing }, (finished) => {
					if (finished) {
						flying.set(false);
						buttonsProgress.set(withTiming(1, { duration: BUTTONS_SHOW_MS, easing: flightEasing }));
						scheduleOnRN(setPhotoLanded, true);
					}
				}),
			);
		});
	}, [buttonsProgress, flying, progress, sheetProgress, targetLayout, targetRef]);

	/** 닫을 때 사진을 카드 자리로 돌려보낸 뒤 화면 닫기 */
	useEffect(() => {
		return navigation.addListener('beforeRemove', (event) => {
			if (closingRef.current) {
				return;
			}

			event.preventDefault();
			closingRef.current = true;

			setPhotoLanded(false);

			/** 화면 이탈 실행 함수 */
			const leave = () => navigation.dispatch(event.data.action);

			scheduleOnUI(() => {
				'worklet';

				buttonsProgress.set(
					withTiming(0, { duration: BUTTONS_HIDE_MS }, () => {
						const to = measure(targetRef);

						if (to) {
							targetLayout.set(to);
							flying.set(true);
						}

						sheetProgress.set(withTiming(0, { duration: CLOSE_MS, easing: sheetCloseEasing }));
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
	}, [buttonsProgress, flying, navigation, progress, sheetProgress, targetLayout, targetRef]);

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
