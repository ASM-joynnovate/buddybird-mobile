import { useEffect, useState } from 'react';

import { StatusBar, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { Trans, useTranslation } from 'react-i18next';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PetcamScene from '@/screens/session/components/petcam-scene';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import GuideBackground from '@/components/guide-background';
import GuidePager from '@/components/guide-pager';
import GuideSheetAccessory from '@/components/guide-sheet-accessory';
import SceneSheet from '@/components/scene-sheet';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { TextButton } from '@/components/ui/text-button';

const STEPS = [
	{ step: 'alert', backgroundColor: colors.orangeSoft, backgroundDark: false },
	{ step: 'place', backgroundColor: sessionColors.background, backgroundDark: true },
	{ step: 'watch', backgroundColor: sessionColors.background, backgroundDark: true },
	{ step: 'dim', backgroundColor: sessionColors.background, backgroundDark: true },
] as const;

/** 펫캠 안내 화면 */
const PetcamGuideScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'PetcamGuide'>>();

	const screenFocused = useIsFocused();

	const [stepIndex, setStepIndex] = useState(0);
	const [headerHeight, setHeaderHeight] = useState(0);

	const setPetcamGuideSeen = useDeviceSettingsStore((state) => state.setPetcamGuideSeen);

	const { step, backgroundColor, backgroundDark } = STEPS[stepIndex];
	const isLastStep = stepIndex === STEPS.length - 1;
	const openedFromHelp = params?.source === 'help';
	const lastButtonLabel = openedFromHelp ? t('common.done') : t('session.petcamGuide.cameraOn');

	/** 첫 단계에서만 스와이프로 뒤로 가기 허용 */
	useEffect(() => {
		navigation.setOptions({ gestureEnabled: stepIndex === 0 });
	}, [stepIndex, navigation]);

	const handleFinish = () => {
		setPetcamGuideSeen(true);
		navigation.goBack();
	};

	const handleNext = () => {
		if (isLastStep) {
			handleFinish();

			return;
		}

		setStepIndex(stepIndex + 1);
	};

	const handleBack = stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined;

	return (
		<GuidePager stepIndex={stepIndex} stepCount={STEPS.length} onStepChange={setStepIndex}>
			<GuideBackground backgroundColor={backgroundColor}>
				{screenFocused && <StatusBar barStyle={backgroundDark ? 'light-content' : 'dark-content'} />}

				<PetcamScene step={step} topInset={headerHeight} />

				<SafeAreaView
					edges={['top', 'left', 'right']}
					onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
					style={styles.headerArea}
				>
					<View style={ui.sceneHeader}>
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
					title=<Trans
						i18nKey={`session.petcamGuide.${step}.title`}
						components={{ b: <Text style={ui.titleHighlight} /> }}
					/>
					accessory=<GuideSheetAccessory stepIndex={stepIndex} stepCount={STEPS.length} />
					footer=<Button label={isLastStep ? lastButtonLabel : t('common.next')} onPress={handleNext} />
				>
					{step === 'alert' && (
						<Copy lineBreakStrategyIOS="hangul-word" style={styles.message}>
							{t('session.petcamGuide.alert.message')}
						</Copy>
					)}
				</SceneSheet>
			</GuideBackground>
		</GuidePager>
	);
};

const styles = StyleSheet.create({
	headerArea: { position: 'absolute', top: 0, right: 0, left: 0 },
	message: { color: colors.muted },
});

export default PetcamGuideScreen;
