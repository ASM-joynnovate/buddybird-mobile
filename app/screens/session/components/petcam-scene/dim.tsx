import { useEffect } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { MoonIcon } from 'lucide-react-native';
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { colors, radius } from '@/theme';

import { getCoverLayout } from '@/components/guide-scene/cover-photo';
import GuideScenePhotoTag from '@/components/guide-scene/photo-tag';

const brightPhoto: number = require('@assets/images/petcam-guide/place-far.jpg');
const dimPhoto: number = require('@assets/images/petcam-guide/dimmed.jpg');

const PHOTO_RATIO = 787 / 1400;
const KNOB_SIZE = 34;
const WIPE_HOLD_MS = 700;

interface Props {
	area: SceneArea;
	topInset: number;
	animated: boolean;
}

/**
 * 화면이 어두워지는 장면 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 * @param animated 애니메이션 실행 여부
 */
const PetcamSceneDim = ({ area, topInset, animated }: Props) => {
	const { t } = useTranslation();

	const dimProgress = useSharedValue(0.5);

	// 밝은 사진 크기 및 위치 계산
	const dimLayout = getCoverLayout(area, PHOTO_RATIO, 0.48);
	const brightWidth = (dimLayout.width * 0.66) / 0.49;
	const brightHeight = brightWidth / PHOTO_RATIO;
	const brightLayout = {
		width: brightWidth,
		height: brightHeight,
		left: dimLayout.left + dimLayout.width * 0.3 - brightWidth * 0.34,
		top: dimLayout.top + dimLayout.height * 0.48 - brightHeight * 0.51,
	};
	const dimPhotoStyle = {
		top: dimLayout.top,
		right: area.width - (dimLayout.left + dimLayout.width),
		width: dimLayout.width,
		height: dimLayout.height,
	};

	const dimClipStyle = useAnimatedStyle(() => ({ width: area.width * dimProgress.get() }));
	const dividerStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: area.width * (1 - dimProgress.get()) }],
	}));

	/** 화면이 어두워지는 애니메이션 반복 */
	useEffect(() => {
		if (!animated) {
			dimProgress.set(0.5);

			return;
		}

		const timing = { duration: 3 * SECOND, easing: Easing.inOut(Easing.cubic) };

		dimProgress.set(0);
		dimProgress.set(
			withRepeat(
				withSequence(
					withDelay(WIPE_HOLD_MS, withTiming(1, timing)),
					withDelay(WIPE_HOLD_MS, withTiming(0, timing)),
				),
				-1,
			),
		);

		return () => cancelAnimation(dimProgress);
	}, [animated, dimProgress]);

	return (
		<>
			<Image accessibilityIgnoresInvertColors source={brightPhoto} style={[styles.photo, brightLayout]} />

			<Animated.View style={[styles.dimClip, dimClipStyle]}>
				<Image accessibilityIgnoresInvertColors source={dimPhoto} style={[styles.photo, dimPhotoStyle]} />
			</Animated.View>

			<Animated.View style={[styles.divider, dividerStyle]}>
				<View style={styles.dividerLine} />
				<View style={styles.dividerKnob} />
			</Animated.View>

			<GuideScenePhotoTag
				icon={MoonIcon}
				label={t('session.petcamGuide.dim.after', { seconds: 10 })}
				variant="inverse"
				order={1}
				style={{ top: topInset + 12, right: 16 }}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	photo: { position: 'absolute' },
	dimClip: { position: 'absolute', top: 0, right: 0, bottom: 0, overflow: 'hidden' },
	divider: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: -KNOB_SIZE / 2,
		width: KNOB_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dividerLine: { position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: colors.onFilled },
	dividerKnob: {
		width: KNOB_SIZE,
		height: KNOB_SIZE,
		borderWidth: 3,
		borderColor: colors.orange,
		borderRadius: radius.pill,
		backgroundColor: colors.onFilled,
	},
});

export default PetcamSceneDim;
