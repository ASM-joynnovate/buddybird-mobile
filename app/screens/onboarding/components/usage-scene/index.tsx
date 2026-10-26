import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import type { UsageStep } from '@/types/guide/usage';
import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { useReducedMotion } from 'react-native-reanimated';

import UsageScenePhoneFrame from '@/screens/onboarding/components/usage-scene/phone-frame';
import UsageScenePlace from '@/screens/onboarding/components/usage-scene/place';
import UsageSceneRecord from '@/screens/onboarding/components/usage-scene/record';
import UsageSceneSessionPreview from '@/screens/onboarding/components/usage-scene/session-preview';

interface Props {
	step: UsageStep;
	topInset: number;
}

/**
 * 사용 안내 단계별 장면 컴포넌트
 * @param step 현재 안내 단계
 * @param topInset 상단 헤더 높이
 */
const UsageScene = ({ step, topInset }: Props) => {
	const { t } = useTranslation();

	const motionReduced = useReducedMotion();

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = !motionReduced;
	const areaMeasured = area.width > 0 && topInset > 0;

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
			{areaMeasured && (
				<>
					{step === 'record' && <UsageSceneRecord area={area} topInset={topInset} animated={animated} />}
					{step === 'place' && <UsageScenePlace area={area} animated={animated} />}
					{step !== 'record' && step !== 'place' && (
						<UsageScenePhoneFrame area={area} topInset={topInset}>
							<UsageSceneSessionPreview step={step} />
						</UsageScenePhoneFrame>
					)}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
});

export default UsageScene;
