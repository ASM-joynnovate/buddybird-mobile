import { useEffect, useState } from 'react';

import { BackHandler, StatusBar, StyleSheet, Text, View } from 'react-native';

import useStartupLanding from '@/hooks/use-startup-landing';

import { Trans, useTranslation } from 'react-i18next';

import { SafeAreaView } from 'react-native-safe-area-context';

import UsageScene from '@/screens/onboarding/components/usage-scene';
import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import GuideBackground from '@/components/guide-background';
import GuideSheetAccessory from '@/components/guide-sheet-accessory';
import SceneSheet from '@/components/scene-sheet';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { TextButton } from '@/components/ui/text-button';

const PHOTO_BACKGROUND = '#000000';
const STEPS = [
	{ step: 'record', backgroundColor: PHOTO_BACKGROUND, headerOnDark: false },
	{ step: 'place', backgroundColor: PHOTO_BACKGROUND, headerOnDark: true },
	{ step: 'live', backgroundColor: colors.bluePale, headerOnDark: false },
	{ step: 'sound', backgroundColor: colors.orangeSoft, headerOnDark: false },
	{ step: 'motion', backgroundColor: colors.orangeSoft, headerOnDark: false },
] as const;

/** 사용 안내 화면 */
const UsageGuideScreen = () => {
	const { t } = useTranslation();

	const [stepIndex, setStepIndex] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(0);

	const setUsageGuideSeen = useDeviceSettingsStore((state) => state.setUsageGuideSeen);

	const { buddyRef, sheetRef, buddyStyle } = useStartupLanding();

	const { step, backgroundColor, headerOnDark } = STEPS[stepIndex];
	const isLastStep = stepIndex === STEPS.length - 1;

	/** onboarding_step_viewed 이벤트 전송 */
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

	return (
		<GuideBackground backgroundColor={backgroundColor}>
			<StatusBar barStyle={headerOnDark ? 'light-content' : 'dark-content'} />

			<UsageScene step={step} topInset={headerHeight} />

			<SafeAreaView
				edges={['top', 'left', 'right']}
				onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
				style={styles.headerArea}
			>
				<View style={ui.sceneHeader}>
					<ScreenHeader
						onBack={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
						backVariant={headerOnDark ? 'onBrand' : 'plain'}
						trailing=<TextButton
							label={t('common.skip')}
							variant={headerOnDark ? 'onBrand' : 'muted'}
							onPress={handleFinish}
						/>
					/>
				</View>
			</SafeAreaView>

			<SceneSheet
				sheetRef={sheetRef}
				title=<Trans
					i18nKey={`onboarding.usage.${step}.title`}
					components={{ b: <Text style={ui.titleHighlight} /> }}
				/>
				accessory=<GuideSheetAccessory
					stepIndex={stepIndex}
					stepCount={STEPS.length}
					buddyRef={buddyRef}
					buddyStyle={buddyStyle}
				/>
				footer=<Button
					label={isLastStep ? t('onboarding.usage.start') : t('common.next')}
					onPress={handleNext}
				/>
			/>
		</GuideBackground>
	);
};

const styles = StyleSheet.create({
	headerArea: { position: 'absolute', top: 0, right: 0, left: 0 },
});

export default UsageGuideScreen;
