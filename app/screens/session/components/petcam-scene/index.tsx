import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import type { PetcamGuideStep } from '@/types/guide/petcam';
import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';

import PetcamSceneDim from '@/screens/session/components/petcam-scene/dim';
import PetcamScenePlace from '@/screens/session/components/petcam-scene/place';
import PetcamSceneWatch from '@/screens/session/components/petcam-scene/watch';

import GuideScenePhoneFrame from '@/components/guide-scene/phone-frame';
import GuideSceneSessionPreview from '@/components/guide-scene/session-preview';

const appearedPhoto: number = require('@assets/images/petcam-guide/appeared.jpg');

interface Props {
	step: PetcamGuideStep;
	topInset: number;
}

/**
 * 펫캠 안내 단계별 장면 컴포넌트
 * @param step 현재 안내 단계
 * @param topInset 상단 헤더 높이
 */
const PetcamScene = ({ step, topInset }: Props) => {
	const { t } = useTranslation();

	const screenFocused = useIsFocused();

	const motionReduced = useReducedMotion();

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = screenFocused && !motionReduced;
	const areaMeasured = area.width > 0 && topInset > 0;

	const handleLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;

		setArea({ width, height });
	};

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={t('common.illustration', { scene: t(`session.petcamGuide.${step}.scene`) })}
			onLayout={handleLayout}
			style={styles.container}
		>
			{areaMeasured && (
				<>
					{step === 'alert' && (
						<GuideScenePhoneFrame area={area} topInset={topInset}>
							<GuideSceneSessionPreview
								step="motion"
								appearedPhoto={appearedPhoto}
								showLogHeader={false}
							/>
						</GuideScenePhoneFrame>
					)}
					{step === 'place' && <PetcamScenePlace area={area} animated={animated} />}
					{step === 'watch' && <PetcamSceneWatch area={area} topInset={topInset} animated={animated} />}
					{step === 'dim' && <PetcamSceneDim area={area} topInset={topInset} animated={animated} />}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
});

export default PetcamScene;
