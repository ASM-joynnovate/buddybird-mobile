import { useEffect, useState } from 'react';

import { StatusBar, Text, View } from 'react-native';

import { Trans, useTranslation } from 'react-i18next';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RecordingScene from '@/screens/words/components/recording-scene';
import { colors } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import GuideBackground from '@/components/guide-background';
import GuidePager from '@/components/guide-pager';
import GuideSheetAccessory from '@/components/guide-sheet-accessory';
import SceneSheet from '@/components/scene-sheet';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { TextButton } from '@/components/ui/text-button';

const STEPS = [
	{ step: 'sameWord', backgroundColor: colors.orangeSoft, backgroundDark: false },
	{ step: 'quiet', backgroundColor: sessionColors.background, backgroundDark: true },
	{ step: 'distance', backgroundColor: colors.orange, backgroundDark: true },
	{ step: 'highVoice', backgroundColor: colors.bluePale, backgroundDark: false },
] as const;

/** 녹음 안내 화면 */
const RecordingGuideScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const screenFocused = useIsFocused();

	const [stepIndex, setStepIndex] = useState(0);

	const { step, backgroundColor, backgroundDark } = STEPS[stepIndex];
	const isLastStep = stepIndex === STEPS.length - 1;

	/** 첫 단계에서만 스와이프로 뒤로 가기 허용 */
	useEffect(() => {
		navigation.setOptions({ gestureEnabled: stepIndex === 0 });
	}, [stepIndex, navigation]);

	const handleNext = () => {
		if (isLastStep) {
			navigation.goBack();

			return;
		}

		setStepIndex(stepIndex + 1);
	};

	const handleBack = stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined;

	return (
		<GuidePager stepIndex={stepIndex} stepCount={STEPS.length} onStepChange={setStepIndex}>
			<GuideBackground backgroundColor={backgroundColor}>
				{screenFocused && <StatusBar barStyle={backgroundDark ? 'light-content' : 'dark-content'} />}

				<SafeAreaView edges={['top', 'left', 'right']}>
					<View style={ui.sceneHeader}>
						<ScreenHeader
							onBack={handleBack}
							backVariant={backgroundDark ? 'onBrand' : 'plain'}
							trailing=<TextButton
								label={t('common.skip')}
								variant={backgroundDark ? 'onBrand' : 'muted'}
								onPress={() => navigation.goBack()}
							/>
						/>
					</View>
				</SafeAreaView>

				<RecordingScene step={step} />

				<SceneSheet
					title=<Trans
						i18nKey={`words.guide.${step}.title`}
						components={{ b: <Text style={ui.titleHighlight} /> }}
					/>
					accessory=<GuideSheetAccessory stepIndex={stepIndex} stepCount={STEPS.length} />
					footer=<Button label={isLastStep ? t('common.done') : t('common.next')} onPress={handleNext} />
				/>
			</GuideBackground>
		</GuidePager>
	);
};

export default RecordingGuideScreen;
