import { useEffect, useState } from 'react';

import { BackHandler, type LayoutChangeEvent, StatusBar, Text, View } from 'react-native';

import useStartupLanding from '@/hooks/use-startup-landing';

import { Trans, useTranslation } from 'react-i18next';

import Animated, {
	css,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth } from '@/theme';

import UsageScene, { type UsageStep } from '@/components/app/usage-guide-screen/usage-scene';
import Mascot from '@/components/mascot';
import SceneSheet from '@/components/scene-sheet';
import { Button } from '@/components/ui/button';
import { PageDots } from '@/components/ui/page-dots';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';

const PHOTO_BACKGROUND = '#000000';
const STEPS: readonly { step: UsageStep; backgroundColor: string; backgroundDark: boolean }[] = [
	{ step: 'record', backgroundColor: PHOTO_BACKGROUND, backgroundDark: false },
	{ step: 'place', backgroundColor: PHOTO_BACKGROUND, backgroundDark: true },
	{ step: 'live', backgroundColor: colors.bluePale, backgroundDark: false },
	{ step: 'sound', backgroundColor: colors.orangeSoft, backgroundDark: false },
	{ step: 'motion', backgroundColor: colors.orangeSoft, backgroundDark: false },
];
const BACKGROUND_TRANSITION_MS = 420;
const MASCOT_SIZE = 96;
const HOP_HEIGHT = 12;
const HOP_UP_MS = 180;
const HOP_DOWN_MS = 270;

/** 사용 안내 화면 */
const UsageGuideScreen = () => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const mascotY = useSharedValue(0);

	const [stepIndex, setStepIndex] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(0);

	const { buddyRef, sheetRef, buddyStyle } = useStartupLanding();

	const setUsageGuideSeen = useDeviceSettingsStore((state) => state.setUsageGuideSeen);

	const { step, backgroundColor, backgroundDark } = STEPS[stepIndex];
	const isLastStep = stepIndex === STEPS.length - 1;

	const mascotHopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: mascotY.get() }] }));

	/** 분석 초기화 후 onboarding_step_viewed 이벤트 전송 */
	useEffect(() => {
		void initializeTelemetry()
			.then(() => trackOnboardingStepViewed('usage_guide'))
			.catch((error) => reportError(error, 'usage_guide_viewed'));
	}, []);

	/** 안드로이드 뒤로 가기 버튼으로 이전 단계 이동 */
	useEffect(() => {
		if (stepIndex === 0) {
			return;
		}

		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			setStepIndex(stepIndex - 1);

			return true;
		});

		return () => subscription.remove();
	}, [stepIndex]);

	/** 단계가 바뀌면 버디가 한 번 뜀 */
	useEffect(() => {
		if (reducedMotion) {
			return;
		}

		mascotY.set(
			withSequence(withTiming(-HOP_HEIGHT, { duration: HOP_UP_MS }), withTiming(0, { duration: HOP_DOWN_MS })),
		);
	}, [mascotY, reducedMotion, stepIndex]);

	const handleFinish = () => {
		trackOnboardingStepCompleted('usage_guide');

		setUsageGuideSeen(true);
	};

	const handleNext = () => {
		if (isLastStep) {
			handleFinish();

			return;
		}

		setStepIndex(stepIndex + 1);
	};

	const handleBack = stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined;

	const handleHeaderLayout = (event: LayoutChangeEvent) => {
		setHeaderHeight(event.nativeEvent.layout.height);
	};

	return (
		<Animated.View style={[styles.container, { backgroundColor }, !reducedMotion && styles.backgroundTransition]}>
			<StatusBar barStyle={backgroundDark ? 'light-content' : 'dark-content'} />

			<UsageScene step={step} topInset={headerHeight} />

			<SafeAreaView edges={['top', 'left', 'right']} onLayout={handleHeaderLayout} style={styles.headerArea}>
				<View style={styles.header}>
					<ScreenHeader
						onBack={handleBack}
						backVariant={backgroundDark ? 'onBrand' : 'plain'}
						trailing=<TextButton
							label={t('common.skip')}
							variant={backgroundDark ? 'onBrand' : 'muted'}
							onPress={handleFinish}
						/>
					/>
				</View>
			</SafeAreaView>

			<SceneSheet
				sheetRef={sheetRef}
				title=<Trans
					i18nKey={`onboarding.usage.${step}.title`}
					components={{ b: <Text style={styles.titleHighlight} /> }}
				/>
				accessory={
					<View style={styles.sheetTopRow}>
						<Animated.View ref={buddyRef} style={[styles.mascotContainer, mascotHopStyle, buddyStyle]}>
							<Mascot size={MASCOT_SIZE} />
						</Animated.View>
						<PageDots
							count={STEPS.length}
							currentIndex={stepIndex}
							label={t('common.stepProgress', { current: stepIndex + 1, total: STEPS.length })}
						/>
					</View>
				}
				footer=<Button
					label={isLastStep ? t('onboarding.usage.start') : t('common.next')}
					onPress={handleNext}
				/>
			/>
		</Animated.View>
	);
};

const styles = css.create({
	container: { flex: 1 },
	backgroundTransition: { transitionProperty: 'backgroundColor', transitionDuration: BACKGROUND_TRANSITION_MS },
	headerArea: { position: 'absolute', top: 0, right: 0, left: 0 },
	header: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20 },
	sheetTopRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
	mascotContainer: { position: 'absolute', left: -4, top: -82 },
	titleHighlight: { color: colors.orangeDark },
});

export default UsageGuideScreen;
