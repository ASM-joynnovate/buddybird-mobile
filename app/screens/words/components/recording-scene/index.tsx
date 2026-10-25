import { useState } from 'react';

import { type LayoutChangeEvent, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { RecordingGuideStep } from '@/types/guide/recording';
import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';

import RecordingSceneDistance from '@/screens/words/components/recording-scene/distance';
import RecordingSceneHighVoice from '@/screens/words/components/recording-scene/high-voice';
import RecordingSceneQuiet from '@/screens/words/components/recording-scene/quiet';
import RecordingSceneSameWord from '@/screens/words/components/recording-scene/same-word';
import { colors } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import SceneStage, { getStageScale } from '@/components/scene-stage';

const STAGE_WIDTH = 375;
const STAGE_HEIGHT = 400;

interface Props {
	step: RecordingGuideStep;
}

/**
 * 녹음 가이드 단계별 장면 컴포넌트
 * @param step 현재 안내 단계
 */
const RecordingScene = ({ step }: Props) => {
	const { t } = useTranslation();

	const screenFocused = useIsFocused();

	const motionReduced = useReducedMotion();

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = screenFocused && !motionReduced;
	const scale = getStageScale(area, STAGE_WIDTH, STAGE_HEIGHT);
	const floorStyles: Record<RecordingGuideStep, StyleProp<ViewStyle>> = {
		sameWord: styles.hiddenFloor,
		quiet: styles.quietFloor,
		distance: styles.distanceFloor,
		highVoice: styles.hiddenFloor,
	};

	const handleLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;

		setArea({ width, height });
	};

	return (
		<SceneStage
			key={step}
			label={t('common.illustration', { scene: t(`words.guide.${step}.scene`) })}
			stageWidth={STAGE_WIDTH}
			stageHeight={STAGE_HEIGHT}
			scale={scale}
			floorStyle={floorStyles[step]}
			onLayout={handleLayout}
		>
			{step === 'sameWord' && <RecordingSceneSameWord scale={scale} />}
			{step === 'quiet' && <RecordingSceneQuiet scale={scale} animated={animated} />}
			{step === 'distance' && <RecordingSceneDistance scale={scale} animated={animated} />}
			{step === 'highVoice' && <RecordingSceneHighVoice scale={scale} animated={animated} />}
		</SceneStage>
	);
};

const styles = StyleSheet.create({
	hiddenFloor: { backgroundColor: colors.backgroundTransparent },
	quietFloor: {
		borderTopWidth: 2,
		borderTopColor: sessionColors.track,
		backgroundColor: colors.backgroundTransparent,
	},
	distanceFloor: { backgroundColor: colors.orangeDark },
});

export default RecordingScene;
