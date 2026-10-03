import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';

import { getStageScale, SCENE_FLOOR_HEIGHT, type SceneArea } from '@/screens/onboarding/components/scene-stage';
import UsageSceneKeepOn from '@/screens/onboarding/components/usage-scene/keep-on';
import UsageScenePlace from '@/screens/onboarding/components/usage-scene/place';
import UsageSceneRecord from '@/screens/onboarding/components/usage-scene/record';
import UsageSceneReport from '@/screens/onboarding/components/usage-scene/report';
import { colors } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

const STAGE_WIDTH = 393;
const STAGE_HEIGHT = 360;

export type UsageStep = 'record' | 'place' | 'keepOn' | 'report';

interface Props {
	step: UsageStep;
}

/**
 * 사용 안내 단계별 장면 컴포넌트
 * @param step 현재 안내 단계
 */
const UsageScene = ({ step }: Props) => {
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
			accessibilityLabel={t('common.illustration', { scene: t(`onboarding.usage.${step}.scene`) })}
			onLayout={handleLayout}
			style={styles.container}
		>
			{/*바닥*/}
			{step === 'place' && <View style={[styles.floor, styles.placeFloor]} />}
			{step === 'keepOn' && <View style={[styles.floor, styles.keepOnFloor]} />}

			{scale > 0 && (
				<View key={step} style={[styles.stage, { width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }]}>
					{step === 'record' && <UsageSceneRecord scale={scale} animated={animated} />}
					{step === 'place' && <UsageScenePlace scale={scale} animated={animated} />}
					{step === 'keepOn' && <UsageSceneKeepOn scale={scale} animated={animated} />}
					{step === 'report' && <UsageSceneReport scale={scale} animated={animated} />}
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
	placeFloor: { backgroundColor: colors.orangeDark },
	keepOnFloor: { borderTopWidth: 2, borderTopColor: sessionColors.track },
	stage: { position: 'relative' },
});

export default UsageScene;
