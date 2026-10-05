import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';

import RecordingSceneDistance from '@/screens/words/components/recording-scene/distance';
import RecordingSceneHighVoice from '@/screens/words/components/recording-scene/high-voice';
import RecordingSceneManyRecordings from '@/screens/words/components/recording-scene/many-recordings';
import RecordingSceneQuiet from '@/screens/words/components/recording-scene/quiet';
import { colors } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { getStageScale, SCENE_FLOOR_HEIGHT, type SceneArea } from '@/components/scene-stage';

const STAGE_WIDTH = 375;
const STAGE_HEIGHT = 400;

export type RecordingGuideStep = 'manyRecordings' | 'quiet' | 'distance' | 'highVoice';

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

	const reducedMotion = useReducedMotion();

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = screenFocused && !reducedMotion;
	const scale = getStageScale(area, STAGE_WIDTH, STAGE_HEIGHT);

	const handleLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;

		setArea({ width, height });
	};

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.illustration', { scene: t(`words.guide.${step}.scene`) })}
			onLayout={handleLayout}
			style={styles.container}
		>
			{/*바닥*/}
			{step === 'quiet' && <View style={[styles.floor, styles.quietFloor]} />}
			{step === 'distance' && <View style={[styles.floor, styles.distanceFloor]} />}

			{scale > 0 && (
				<View key={step} style={[styles.stage, { width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }]}>
					{step === 'manyRecordings' && <RecordingSceneManyRecordings scale={scale} />}
					{step === 'quiet' && <RecordingSceneQuiet scale={scale} animated={animated} />}
					{step === 'distance' && <RecordingSceneDistance scale={scale} animated={animated} />}
					{step === 'highVoice' && <RecordingSceneHighVoice scale={scale} animated={animated} />}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingBottom: SCENE_FLOOR_HEIGHT,
		overflow: 'hidden',
	},
	floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SCENE_FLOOR_HEIGHT },
	quietFloor: { borderTopWidth: 2, borderTopColor: sessionColors.track },
	distanceFloor: { backgroundColor: colors.orangeDark },
	stage: { position: 'relative' },
});

export default RecordingScene;
