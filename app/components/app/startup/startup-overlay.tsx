import { useEffect, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import type { LandingTarget } from '@/types/startup';

import { useTranslation } from 'react-i18next';

import Animated, {
	type AnimatedRef,
	Easing,
	interpolate,
	type MeasuredDimensions,
	measure,
	useAnimatedRef,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { SECOND } from '@/config/units';
import { useAppStore } from '@/stores/app';
import { burstEasing, colors, contentMaxWidth, radius } from '@/theme';

import StartupScreenPerch from '@/components/app/startup/perch';
import MascotArtwork from '@/components/mascot/artwork';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

const BAR_POSITION = 0.56;
const BUDDY_SIZE_RATIO = 0.23;
const BUDDY_MIN_SIZE = 64;
const BUDDY_MAX_SIZE = 144;

const LANDING_WAIT_MS = 2 * SECOND;
const RETRY_SEATED_MS = 2.4 * SECOND;
const WORDS_HIDE_MS = 200;
const WORDS_DROP = 12;
const FLIGHT_DELAY_MS = 50;
const FLY_UP_MS = 600;
const DROP_DOWN_MS = 700;
const PERCH_EXIT_DELAY_MS = 150;
const PERCH_EXIT_MS = 450;
const LIFT_AWAY_DELAY_MS = 100;
const LIFT_AWAY_MS = 500;
const PERCH_EXIT_DIP = 16;
const PERCH_EXIT_MARGIN = 40;
const BACKGROUND_FADE_DELAY_MS = 200;
const BACKGROUND_FADE_MS = 300;
const SHEET_MORPH_DELAY_MS = 100;
const SHEET_MORPH_MS = 500;
const SHEET_FADE_DELAY_MS = 600;
const SHEET_FADE_MS = 150;

const FLY_UP_STOPS = [0, 0.18, 0.55, 1];
const DROP_DOWN_STOPS = [0, 0.15, 0.4, 0.84, 1];
const PERCH_EXIT_STOPS = [0, 0.22, 1];
const CROUCH_Y = 8;
const CROUCH_SCALE_X = 1.12;
const CROUCH_SCALE_Y = 0.84;
const DROP_RISE = 44;

const wordsHideEasing = Easing.bezier(0.7, 0, 0.84, 0);
const flyUpEasing = Easing.bezier(0.3, 0, 0.2, 1);
const dropDownEasing = Easing.bezier(0.3, 0, 0.3, 1);
const perchExitEasing = Easing.bezier(0.6, 0, 0.9, 0.4);
const backgroundFadeEasing = Easing.bezier(0, 0, 0.58, 1);

type LandingMotion = 'none' | 'flyUp' | 'dropDown' | 'liftAway';

/**
 * 이동 중인 버디의 위치 및 크기 계산 함수
 * @param motion 이동 방식
 * @param progress 이동 진행도
 * @param dx 목적지까지의 가로 거리
 * @param dy 목적지까지의 세로 거리
 * @param scale 목적지 버디의 크기 비율
 */
const flightFrameOf = (motion: 'flyUp' | 'dropDown', progress: number, dx: number, dy: number, scale: number) => {
	'worklet';

	if (motion === 'flyUp') {
		const halfScale = (1 + scale) / 2;

		return {
			x: interpolate(progress, FLY_UP_STOPS, [0, 0, dx * 0.45, dx]),
			y: interpolate(progress, FLY_UP_STOPS, [0, CROUCH_Y, dy * 0.96, dy]),
			scaleX: interpolate(progress, FLY_UP_STOPS, [1, CROUCH_SCALE_X, halfScale, scale]),
			scaleY: interpolate(progress, FLY_UP_STOPS, [1, CROUCH_SCALE_Y, halfScale, scale]),
		};
	}

	const jumpScale = 1 - (1 - scale) * 0.3;

	return {
		x: interpolate(progress, DROP_DOWN_STOPS, [0, 0, dx * 0.45, dx, dx]),
		y: interpolate(progress, DROP_DOWN_STOPS, [0, CROUCH_Y, -DROP_RISE, dy, dy]),
		scaleX: interpolate(progress, DROP_DOWN_STOPS, [1, CROUCH_SCALE_X, jumpScale, scale * CROUCH_SCALE_X, scale]),
		scaleY: interpolate(progress, DROP_DOWN_STOPS, [1, CROUCH_SCALE_Y, jumpScale, scale * CROUCH_SCALE_Y, scale]),
	};
};

/** 화면에 붙은 view의 위치 측정 함수 */
const measureAttached = (ref: AnimatedRef<Animated.View>) => {
	'worklet';

	return ref() ? measure(ref) : null;
};

/** 흰 바탕이 사라지는 애니메이션을 만드는 함수 */
const backgroundFadeMotion = () => {
	'worklet';

	return withDelay(
		BACKGROUND_FADE_DELAY_MS,
		withTiming(1, { duration: BACKGROUND_FADE_MS, easing: backgroundFadeEasing }),
	);
};

interface LandingRequest {
	target: LandingTarget | null;
}

/** 앱 시작 화면 컴포넌트 */
const StartupOverlay = () => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const motionReduced = useReducedMotion();

	const [sceneBottom, setSceneBottom] = useState(0);

	const startupScreen = useAppStore((state) => state.startupScreen);

	const [buddySeated, setBuddySeated] = useState(startupScreen?.onRetry === undefined);
	const [buddyArriving, setBuddyArriving] = useState(false);
	const [retryShown, setRetryShown] = useState(startupScreen?.onRetry !== undefined);
	const [landingRequest, setLandingRequest] = useState<LandingRequest | null>(null);

	const perchBuddyRef = useAnimatedRef<Animated.View>();

	const landingMotion = useSharedValue<LandingMotion>('none');
	const flightFrom = useSharedValue<MeasuredDimensions | null>(null);
	const flightTo = useSharedValue<MeasuredDimensions | null>(null);
	const sheetFrom = useSharedValue<MeasuredDimensions | null>(null);
	const flightProgress = useSharedValue(0);
	const perchExit = useSharedValue(0);
	const wordsHideProgress = useSharedValue(0);
	const backgroundFade = useSharedValue(0);
	const sheetMorph = useSharedValue(0);

	const landingTarget = useAppStore((state) => state.landingTarget);
	const splashFinished = useAppStore((state) => state.splashFinished);

	const hideStartupOverlay = useAppStore((state) => state.hideStartupOverlay);

	const starting = startupScreen !== null;
	const failed = startupScreen?.onRetry !== undefined;
	const failureShown = failed && !buddyArriving;
	const buddySize = Math.min(BUDDY_MAX_SIZE, Math.max(BUDDY_MIN_SIZE, sceneBottom * BUDDY_SIZE_RATIO));
	const barBottom = sceneBottom * BAR_POSITION;
	const targetBuddyRef = landingRequest?.target?.buddyRef;
	const targetSheetRef = landingRequest?.target?.sheetRef;

	// 다시 시도 시 버디가 앉은 뒤 실패 반영
	if (starting && !failed && !buddySeated) {
		setBuddySeated(true);
		setBuddyArriving(!motionReduced);
	}

	if (failureShown && buddySeated) {
		setBuddySeated(false);
	}

	if (failureShown && !retryShown) {
		setRetryShown(true);
	}

	// 이동 중 시작 화면 요청 시 횃대 장면으로 복귀
	if (starting && landingRequest) {
		setLandingRequest(null);
	}

	// bottom sheet 위치를 프레임마다 측정
	const backgroundStyle = useAnimatedStyle(() => {
		const sheet =
			landingMotion.get() === 'dropDown' && targetSheetRef
				? (measureAttached(targetSheetRef) ?? sheetFrom.get())
				: null;

		return {
			opacity: 1 - backgroundFade.get(),
			borderTopLeftRadius: radius.sheet * sheetMorph.get(),
			borderTopRightRadius: radius.sheet * sheetMorph.get(),
			transform: [{ translateY: (sheet?.pageY ?? 0) * sheetMorph.get() }],
		};
	});

	const wordsStyle = useAnimatedStyle(() => ({
		opacity: 1 - wordsHideProgress.get(),
		transform: [{ translateY: WORDS_DROP * wordsHideProgress.get() }],
	}));

	const perchExitStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(perchExit.get(), PERCH_EXIT_STOPS, [
					0,
					PERCH_EXIT_DIP,
					-(barBottom + PERCH_EXIT_MARGIN),
				]),
			},
		],
	}));

	const perchBuddyStyle = useAnimatedStyle(() => {
		const motion = landingMotion.get();

		return { opacity: motion === 'flyUp' || motion === 'dropDown' ? 0 : 1 };
	});

	// 목적지 위치를 프레임마다 측정
	const flyingBuddyStyle = useAnimatedStyle(() => {
		const motion = landingMotion.get();
		const from = flightFrom.get();
		const to = (targetBuddyRef ? measureAttached(targetBuddyRef) : null) ?? flightTo.get();

		if ((motion !== 'flyUp' && motion !== 'dropDown') || !from || !to) {
			return { opacity: 0 };
		}

		const fromX = from.pageX + from.width / 2;
		const fromY = from.pageY + from.height / 2;
		const frame = flightFrameOf(
			motion,
			flightProgress.get(),
			to.pageX + to.width / 2 - fromX,
			to.pageY + to.height / 2 - fromY,
			to.width / buddySize,
		);

		return {
			opacity: 1,
			width: buddySize,
			height: buddySize,
			transform: [
				{ translateX: fromX - buddySize / 2 + frame.x },
				{ translateY: fromY - buddySize / 2 + frame.y },
				{ scaleX: frame.scaleX },
				{ scaleY: frame.scaleY },
			],
		};
	});

	/** 버디가 앉은 뒤 실패 화면 표시 */
	useEffect(() => {
		if (!buddyArriving) {
			return;
		}

		const timer = setTimeout(() => setBuddyArriving(false), RETRY_SEATED_MS);

		return () => clearTimeout(timer);
	}, [buddyArriving]);

	/** 시작 화면 요청이 없으면 목적지 버디 대기 */
	useEffect(() => {
		if (starting || landingRequest || buddyArriving) {
			return;
		}

		if (!splashFinished || motionReduced) {
			hideStartupOverlay();

			return;
		}

		if (landingTarget) {
			setLandingRequest({ target: landingTarget });

			return;
		}

		const timer = setTimeout(() => setLandingRequest({ target: null }), LANDING_WAIT_MS);

		return () => clearTimeout(timer);
	}, [buddyArriving, hideStartupOverlay, landingRequest, landingTarget, motionReduced, splashFinished, starting]);

	/** 목적지가 정해지면 버디를 목적지로 이동 */
	useEffect(() => {
		if (!landingRequest) {
			return;
		}

		const { target } = landingRequest;

		scheduleOnUI(() => {
			'worklet';

			wordsHideProgress.set(withTiming(1, { duration: WORDS_HIDE_MS, easing: wordsHideEasing }));

			const from = measureAttached(perchBuddyRef);
			const to = target ? measureAttached(target.buddyRef) : null;

			// 목적지 버디가 없으면 횃대 및 버디가 위로 이동
			if (!buddySeated || !target || !from || !to) {
				landingMotion.set('liftAway');
				backgroundFade.set(backgroundFadeMotion());
				perchExit.set(
					withDelay(
						LIFT_AWAY_DELAY_MS,
						withTiming(1, { duration: LIFT_AWAY_MS, easing: perchExitEasing }, (finished) => {
							if (finished) {
								scheduleOnRN(hideStartupOverlay);
							}
						}),
					),
				);

				return;
			}

			const sheet = measureAttached(target.sheetRef);

			target.buddyHidden.set(true);
			flightFrom.set(from);
			flightTo.set(to);
			sheetFrom.set(sheet);
			landingMotion.set(sheet ? 'dropDown' : 'flyUp');

			perchExit.set(
				withDelay(PERCH_EXIT_DELAY_MS, withTiming(1, { duration: PERCH_EXIT_MS, easing: perchExitEasing })),
			);
			flightProgress.set(
				withDelay(
					FLIGHT_DELAY_MS,
					withTiming(
						1,
						{ duration: sheet ? DROP_DOWN_MS : FLY_UP_MS, easing: sheet ? dropDownEasing : flyUpEasing },
						(finished) => {
							if (finished) {
								target.buddyHidden.set(false);
								scheduleOnRN(hideStartupOverlay);
							}
						},
					),
				),
			);

			if (!sheet) {
				backgroundFade.set(backgroundFadeMotion());

				return;
			}

			// 흰 바탕이 bottom sheet로 변한 뒤 사라짐
			sheetMorph.set(
				withDelay(SHEET_MORPH_DELAY_MS, withTiming(1, { duration: SHEET_MORPH_MS, easing: burstEasing })),
			);
			backgroundFade.set(withDelay(SHEET_FADE_DELAY_MS, withTiming(1, { duration: SHEET_FADE_MS })));
		});

		// 이동 중 정지 시 애니메이션 값 초기화
		return () => {
			scheduleOnUI(() => {
				'worklet';

				landingMotion.set('none');
				flightProgress.set(0);
				perchExit.set(0);
				wordsHideProgress.set(0);
				backgroundFade.set(0);
				sheetMorph.set(0);
				target?.buddyHidden.set(false);
			});
		};
	}, [
		backgroundFade,
		buddySeated,
		flightFrom,
		flightProgress,
		flightTo,
		hideStartupOverlay,
		landingRequest,
		landingMotion,
		perchBuddyRef,
		perchExit,
		sheetFrom,
		sheetMorph,
		wordsHideProgress,
	]);

	/** 제목 위에 남은 높이 저장 */
	const handleLayoutScene = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		setSceneBottom(y + height);
	};

	return (
		<View accessibilityViewIsModal pointerEvents={landingRequest ? 'none' : 'auto'} style={StyleSheet.absoluteFill}>
			<Animated.View style={[styles.background, backgroundStyle]} />

			<View
				pointerEvents="box-none"
				style={[
					styles.content,
					{
						paddingTop: insets.top,
						paddingBottom: insets.bottom + 20,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					},
				]}
			>
				<View style={styles.sceneSpace} onLayout={handleLayoutScene} />

				<Animated.View style={[styles.bottomContainer, wordsStyle]}>
					<View
						accessible={!failureShown}
						accessibilityLabel={failureShown ? undefined : t('app.startup.loading')}
						accessibilityLiveRegion="polite"
						style={styles.words}
					>
						<Title style={[styles.title, !failureShown && styles.hidden]}>
							{t('app.startupError.title')}
						</Title>
						<Copy
							accessibilityElementsHidden={!failureShown}
							importantForAccessibility={failureShown ? 'auto' : 'no-hide-descendants'}
							lineBreakStrategyIOS="hangul-word"
							style={[styles.message, !failureShown && styles.hidden]}
						>
							{t('app.startupError.message')}
						</Copy>
					</View>

					{/*실패한 적이 없으면 버튼 높이만 비워 둠*/}
					<View
						accessibilityElementsHidden={!retryShown}
						importantForAccessibility={retryShown ? 'auto' : 'no-hide-descendants'}
						pointerEvents={retryShown ? 'auto' : 'none'}
						style={!retryShown && styles.hidden}
					>
						<Button
							label={t('common.retry')}
							loading={!failureShown}
							onPress={() => startupScreen?.onRetry?.()}
						/>
					</View>
				</Animated.View>
			</View>

			{sceneBottom > 0 && (
				<StartupScreenPerch
					buddySize={buddySize}
					barBottom={barBottom}
					buddySeated={buddySeated}
					dragEnabled={!landingRequest}
					buddyRef={perchBuddyRef}
					buddyStyle={perchBuddyStyle}
					style={perchExitStyle}
				/>
			)}

			<Animated.View pointerEvents="none" style={[styles.flyingBuddy, flyingBuddyStyle]}>
				<MascotArtwork />
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	background: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
	content: { ...StyleSheet.absoluteFill },
	sceneSpace: { flex: 1 },
	bottomContainer: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, gap: 28 },
	words: { alignItems: 'center', gap: 8 },
	title: { textAlign: 'center' },
	message: { fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
	hidden: { opacity: 0 },
	flyingBuddy: { position: 'absolute', top: 0, left: 0 },
});

export default StartupOverlay;
