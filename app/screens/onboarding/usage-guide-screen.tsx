import { useCallback, useEffect } from 'react';

import { StatusBar, Text, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import useGuideStep from '@/hooks/use-guide-step';
import useStartupLanding from '@/hooks/use-startup-landing';

import { Trans, useTranslation } from 'react-i18next';

import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
	css,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import UsageScene, { type UsageStep } from '@/screens/onboarding/components/usage-scene';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { colors, contentMaxWidth } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import Mascot from '@/components/mascot';
import SceneSheet from '@/components/scene-sheet';
import { Button } from '@/components/ui/button';
import { PageDots } from '@/components/ui/page-dots';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';

const STEPS: readonly { step: UsageStep; backgroundColor: string; backgroundDark: boolean }[] = [
	{ step: 'record', backgroundColor: colors.orangeSoft, backgroundDark: false },
	{ step: 'place', backgroundColor: colors.orange, backgroundDark: true },
	{ step: 'keepOn', backgroundColor: sessionColors.background, backgroundDark: true },
	{ step: 'report', backgroundColor: colors.bluePale, backgroundDark: false },
];
const BACKGROUND_TRANSITION_MS = 420;
const MASCOT_SIZE = 96;
const HOP_HEIGHT = 12;
const HOP_UP_MS = 180;
const HOP_DOWN_MS = 270;

/** 사용 안내 화면 */
const UsageGuideScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const screenFocused = useIsFocused();

	const reducedMotion = useReducedMotion();

	const mascotY = useSharedValue(0);

	const { stepIndex, setStepIndex } = useGuideStep();

	const { buddyRef, sheetRef, buddyStyle } = useStartupLanding();

	const { step, backgroundColor, backgroundDark } = STEPS[stepIndex];
	const isLastStep = stepIndex === STEPS.length - 1;

	const mascotHopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: mascotY.get() }] }));

	/** 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('usage_guide');
		}, []),
	);

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

		navigation.navigate('PermissionRequest');
	};

	const handleNext = () => {
		if (isLastStep) {
			handleFinish();

			return;
		}

		setStepIndex(stepIndex + 1);
	};

	const handleBack =
		stepIndex > 0
			? () => setStepIndex(stepIndex - 1)
			: navigation.canGoBack()
				? () => navigation.goBack()
				: undefined;

	return (
		<Animated.View style={[styles.container, { backgroundColor }, !reducedMotion && styles.backgroundTransition]}>
			{screenFocused && <StatusBar barStyle={backgroundDark ? 'light-content' : 'dark-content'} />}

			<SafeAreaView edges={['top', 'left', 'right']}>
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

			<UsageScene step={step} />

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
				footer=<Button label={t('common.next')} onPress={handleNext} />
			/>
		</Animated.View>
	);
};

const styles = css.create({
	container: { flex: 1 },
	backgroundTransition: { transitionProperty: 'backgroundColor', transitionDuration: BACKGROUND_TRANSITION_MS },
	header: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20 },
	sheetTopRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
	mascotContainer: { position: 'absolute', left: -4, top: -82 },
	titleHighlight: { color: colors.orangeDark },
});

export default UsageGuideScreen;
