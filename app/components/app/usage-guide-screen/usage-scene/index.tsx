import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useReducedMotion } from 'react-native-reanimated';

import PhoneFrame from '@/components/app/usage-guide-screen/usage-scene/phone-frame';
import UsageScenePlace from '@/components/app/usage-guide-screen/usage-scene/place';
import UsageSceneRecord from '@/components/app/usage-guide-screen/usage-scene/record';
import SessionPreview, { type PreviewHour } from '@/components/app/usage-guide-screen/usage-scene/session-preview';
import type { SceneArea } from '@/components/scene-stage';

const appearedPhoto: number = require('@assets/images/onboarding/usage-appeared.jpg');

export type UsageStep = 'record' | 'place' | 'live' | 'sound' | 'motion';

type PreviewStep = Exclude<UsageStep, 'record' | 'place'>;

/** 학습 상세 예시에 보일 단계별 기록 */
const PREVIEWS: Record<PreviewStep, { overviewShown: boolean; hour: PreviewHour }> = {
	live: {
		overviewShown: true,
		hour: {
			startedAt: '2025-10-21T15:00:00',
			items: [
				{ kind: 'mimic', startedAt: '2025-10-21T15:36:12', score: 0.92 },
				{ kind: 'parrot', startedAt: '2025-10-21T15:31:04' },
			],
		},
	},
	sound: {
		overviewShown: false,
		hour: {
			startedAt: '2025-10-21T15:00:00',
			items: [
				{
					kind: 'mimic',
					startedAt: '2025-10-21T15:36:12',
					score: 0.92,
					sound: { progress: 0.38, durationMs: 3000 },
				},
				{ kind: 'parrot', startedAt: '2025-10-21T15:31:04' },
				{
					kind: 'distressCall',
					startedAt: '2025-10-21T15:42:10',
					endedAt: '2025-10-21T15:42:22',
					durationMs: 12_000,
				},
			],
		},
	},
	motion: {
		overviewShown: false,
		hour: {
			startedAt: '2025-10-21T16:00:00',
			items: [
				{ kind: 'parrotDisappeared', startedAt: '2025-10-21T16:05:40', endedAt: '2025-10-21T16:11:02' },
				{ kind: 'parrotAppeared', startedAt: '2025-10-21T16:11:02', photo: appearedPhoto },
			],
		},
	},
};

interface Props {
	step: UsageStep;
	topInset: number;
}

/**
 * 사용 안내 단계별 장면 컴포넌트. 시트 뒤까지 화면 위쪽을 모두 채운다
 * @param step 현재 안내 단계
 * @param topInset 상단 헤더가 차지하는 높이
 */
const UsageScene = ({ step, topInset }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const [area, setArea] = useState<SceneArea>({ width: 0, height: 0 });

	const animated = !reducedMotion;
	const measured = area.width > 0 && topInset > 0;

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
			{measured && step === 'record' && (
				<UsageSceneRecord key={step} area={area} topInset={topInset} animated={animated} />
			)}
			{measured && step === 'place' && <UsageScenePlace key={step} area={area} animated={animated} />}
			{measured && step !== 'record' && step !== 'place' && (
				<PhoneFrame area={area} topInset={topInset}>
					<SessionPreview key={step} {...PREVIEWS[step]} />
				</PhoneFrame>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden' },
});

export default UsageScene;
