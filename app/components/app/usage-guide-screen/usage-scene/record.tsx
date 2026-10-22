import { useEffect, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import Animated, {
	cancelAnimation,
	Easing,
	FadeIn,
	interpolate,
	type SharedValue,
	useAnimatedProps,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { SECOND } from '@/config/units';
import { colors } from '@/theme';

import UsageSceneCoverPhoto, {
	getCoverLayout,
	toScenePoint,
} from '@/components/app/usage-guide-screen/usage-scene/cover-photo';
import UsageScenePhotoPin from '@/components/app/usage-guide-screen/usage-scene/photo-pin';
import UsageSceneVoiceCard from '@/components/app/usage-guide-screen/usage-scene/voice-card';
import type { SceneArea } from '@/components/scene-stage';

const photo: number = require('@assets/images/onboarding/usage-record.jpg');

const PHOTO_ASPECT_RATIO = 864 / 1536;
const PHOTO_FOCUS_Y = 0.49;
const TIMER_POINT = { x: 0.2417, y: 0.6175 };
const SOUND_POINT = { x: 0.636, y: 0.5388 };
const SOUND_WIDTH_RATIO = 0.1374;
const SOUND_ASPECT_RATIO = 60 / 80;
const SOUND_ARCS = ['M8 28c8 6 8 18 0 24', 'M22 18c14 10 14 34 0 44', 'M36 8c20 14 20 50 0 64'];
const SOUND_MS = 1.8 * SECOND;
const CARD_LEFT = 18;
const CARD_TOP_GAP = 6;
const LINK_START_X = 41;

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SoundArcProps {
	path: string;
	index: number;
	progress: SharedValue<number>;
	animated: boolean;
}

/**
 * 소리 물결 한 겹 컴포넌트
 * @param path 물결 모양
 * @param index 태블릿에서 가까운 순서
 * @param progress 물결 애니메이션 진행도
 * @param animated 애니메이션 실행 여부
 */
const SoundArc = ({ path, index, progress, animated }: SoundArcProps) => {
	const arcProps = useAnimatedProps(() => {
		if (!animated) {
			return { opacity: 1 };
		}

		const phase = (progress.get() - index / SOUND_ARCS.length + 1) % 1;

		return { opacity: interpolate(phase, [0, 0.15, 0.6, 1], [0.15, 1, 0.15, 0.15]) };
	});

	return (
		<AnimatedPath
			animatedProps={arcProps}
			d={path}
			fill="none"
			stroke={colors.orange}
			strokeWidth={5}
			strokeLinecap="round"
		/>
	);
};

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

	const layout = getCoverLayout(area, PHOTO_ASPECT_RATIO, PHOTO_FOCUS_Y);
	const timer = toScenePoint(layout, TIMER_POINT);
	const sound = toScenePoint(layout, SOUND_POINT);
	const soundWidth = layout.width * SOUND_WIDTH_RATIO;
	const cardTop = topInset + CARD_TOP_GAP;
	const linkStart = { x: CARD_LEFT + LINK_START_X, y: cardTop + cardHeight };
	const linkDistance = { x: timer.x - linkStart.x, y: timer.y - linkStart.y };
	const linkPath = [
		`M${linkStart.x} ${linkStart.y}`,
		`C${linkStart.x} ${linkStart.y + linkDistance.y * 0.5}`,
		`${linkStart.x + linkDistance.x * 0.72} ${linkStart.y + linkDistance.y * 0.58}`,
		`${timer.x} ${timer.y}`,
	].join(' ');

	/** 소리 물결 애니메이션 반복 */
	useEffect(() => {
		if (!animated) {
			return;
		}

		soundProgress.set(withRepeat(withTiming(1, { duration: SOUND_MS, easing: Easing.linear }), -1));

		return () => cancelAnimation(soundProgress);
	}, [animated, soundProgress]);

	const handleCardLayout = (event: LayoutChangeEvent) => {
		setCardHeight(event.nativeEvent.layout.height);
	};

	return (
		<>
			<UsageSceneCoverPhoto source={photo} layout={layout} />

			{/*소리 물결*/}
			<View
				style={[
					styles.sound,
					{ left: sound.x, top: sound.y, width: soundWidth, height: soundWidth / SOUND_ASPECT_RATIO },
				]}
			>
				<Svg width="100%" height="100%" viewBox="0 0 60 80">
					{SOUND_ARCS.map((path, index) => (
						<SoundArc key={path} path={path} index={index} progress={soundProgress} animated={animated} />
					))}
				</Svg>
			</View>

			{/*카드에서 태블릿 타이머까지 잇는 점선*/}
			{cardHeight > 0 && timer.y > linkStart.y && (
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

			<UsageScenePhotoPin x={timer.x} y={timer.y} animated={animated} />

			<UsageSceneVoiceCard left={CARD_LEFT} top={cardTop} animated={animated} onLayout={handleCardLayout} />
		</>
	);
};

const styles = StyleSheet.create({
	sound: { position: 'absolute' },
});

export default UsageSceneRecord;
