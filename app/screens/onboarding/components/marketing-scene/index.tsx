import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';
import { GiftIcon, SparklesIcon } from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import MarketingSceneNote from '@/screens/onboarding/components/marketing-scene/note';
import SceneStage, { getStageScale, type SceneArea } from '@/screens/onboarding/components/scene-stage';
import SceneWindow from '@/screens/onboarding/components/scene-window';
import { colors } from '@/theme';

import Mascot from '@/components/mascot';

const STAGE_WIDTH = 393;
const STAGE_HEIGHT = 350;
const FEATURES_NOTE_DELAY_MS = 0.3 * SECOND;
const EVENTS_NOTE_DELAY_MS = 0.9 * SECOND;

/** 횃대 위 버디와 벽에 붙은 새 소식 장면 컴포넌트 */
const MarketingScene = () => {
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
		<SceneStage
			label={t('common.illustration', { scene: t('onboarding.marketing.scene') })}
			stageWidth={STAGE_WIDTH}
			stageHeight={STAGE_HEIGHT}
			scale={scale}
			onLayout={handleLayout}
		>
			{/*횃대*/}
			<Svg
				width="100%"
				height="100%"
				viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
				style={StyleSheet.absoluteFill}
			>
				<G transform="translate(46 200)" fill="none" strokeLinecap="round">
					<Path d="M14 8h92" stroke={colors.orangeDark} strokeWidth={8} />
					<Path d="M60 8v136" stroke={colors.subtle} strokeWidth={6} />
					<Path d="M28 146h64" stroke={colors.subtle} strokeWidth={7} />
				</G>
			</Svg>

			<SceneWindow scale={scale} animated={animated} style={{ left: 30 * scale, top: 10 * scale }} />

			<View style={[styles.mascot, { left: 44 * scale, bottom: 124 * scale }]}>
				<Mascot size={124 * scale} floating={false} />
			</View>

			<MarketingSceneNote
				icon={SparklesIcon}
				label={t('onboarding.marketing.news.features')}
				tilt={-4}
				delay={FEATURES_NOTE_DELAY_MS}
				animated={animated}
				style={{ right: 22 * scale, top: 40 * scale }}
			/>
			<MarketingSceneNote
				icon={GiftIcon}
				label={t('onboarding.marketing.news.events')}
				tilt={3}
				delay={EVENTS_NOTE_DELAY_MS}
				animated={animated}
				style={{ right: 46 * scale, bottom: 50 * scale }}
			/>
		</SceneStage>
	);
};

const styles = StyleSheet.create({
	mascot: { position: 'absolute' },
});

export default MarketingScene;
