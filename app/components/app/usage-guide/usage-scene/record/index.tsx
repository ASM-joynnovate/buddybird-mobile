import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SceneArea } from '@/types/scene';

import Animated, {
	cancelAnimation,
	Easing,
	FadeIn,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import { colors } from '@/theme';

import UsageSceneRecordSoundArc, { SOUND_ARCS } from '@/components/app/usage-guide/usage-scene/record/sound-arc';
import UsageSceneVoiceCard from '@/components/app/usage-guide/usage-scene/voice-card';
import GuideSceneCoverPhoto, { getCoverLayout, toScenePoint } from '@/components/guide-scene/cover-photo';
import GuideScenePhotoPin from '@/components/guide-scene/photo-pin';

const photo: number = require('@assets/images/usage-guide/record.jpg');

const CARD_LEFT = 18;

interface Props {
	area: SceneArea;
	topInset: number;
	animated: boolean;
}

/**
 * 녹음한 단어를 들려주는 장면 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 * @param animated 애니메이션 실행 여부
 */
const UsageSceneRecord = ({ area, topInset, animated }: Props) => {
	const soundProgress = useSharedValue(0);

	const [cardHeight, setCardHeight] = useState(0);

	const layout = getCoverLayout(area, 864 / 1536, 0.49);
	const timerPoint = toScenePoint(layout, { x: 0.2417, y: 0.6175 });
	const soundPoint = toScenePoint(layout, { x: 0.636, y: 0.5388 });
	const soundWidth = layout.width * 0.1374;
	const cardTop = topInset + 6;
	const linkStart = { x: CARD_LEFT + 41, y: cardTop + cardHeight };
	const linkDistance = { x: timerPoint.x - linkStart.x, y: timerPoint.y - linkStart.y };
	const linkPath = [
		`M${linkStart.x} ${linkStart.y}`,
		`C${linkStart.x} ${linkStart.y + linkDistance.y * 0.5}`,
		`${linkStart.x + linkDistance.x * 0.72} ${linkStart.y + linkDistance.y * 0.58}`,
		`${timerPoint.x} ${timerPoint.y}`,
	].join(' ');

	/** 소리 물결 애니메이션 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		soundProgress.set(withRepeat(withTiming(1, { duration: 1.8 * SECOND, easing: Easing.linear }), -1));

		return () => cancelAnimation(soundProgress);
	}, [animated, soundProgress]);

	return (
		<>
			<GuideSceneCoverPhoto source={photo} layout={layout} />

			{/*소리 물결*/}
			<View
				style={[
					styles.sound,
					{ left: soundPoint.x, top: soundPoint.y, width: soundWidth, height: soundWidth / (60 / 80) },
				]}
			>
				<Svg width="100%" height="100%" viewBox="0 0 60 80">
					{SOUND_ARCS.map((path, index) => (
						<UsageSceneRecordSoundArc
							key={path}
							path={path}
							index={index}
							progress={soundProgress}
							animated={animated}
						/>
					))}
				</Svg>
			</View>

			{/*카드에서 태블릿 타이머까지 잇는 점선*/}
			{cardHeight > 0 && timerPoint.y > linkStart.y && (
				<Animated.View entering={FadeIn.delay(240)} style={StyleSheet.absoluteFill}>
					<Svg width="100%" height="100%">
						<Path
							d={linkPath}
							fill="none"
							stroke={colors.onFilled}
							strokeWidth={3}
							strokeDasharray="6 6"
							strokeLinecap="round"
						/>
					</Svg>
				</Animated.View>
			)}

			<GuideScenePhotoPin x={timerPoint.x} y={timerPoint.y} animated={animated} />

			<UsageSceneVoiceCard
				left={CARD_LEFT}
				top={cardTop}
				animated={animated}
				onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	sound: { position: 'absolute' },
});

export default UsageSceneRecord;
