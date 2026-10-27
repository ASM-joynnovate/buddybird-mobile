import { StyleSheet, View } from 'react-native';

import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { SmartphoneIcon, TabletIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import PetcamSceneWatchPreview from '@/screens/session/components/petcam-scene/watch-preview';
import { colors, radius } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import GuideSceneCoverPhoto, { getCoverLayout, toScenePoint } from '@/components/guide-scene/cover-photo';
import GuideScenePhoneFrame, { getPhoneFrameSize } from '@/components/guide-scene/phone-frame';
import GuideScenePhotoPin from '@/components/guide-scene/photo-pin';
import GuideScenePhotoTag, { PHOTO_TAG_HEIGHT } from '@/components/guide-scene/photo-tag';

const photo: number = require('@assets/images/petcam-guide/place.jpg');

const PHONE_SCALE = 0.38;
const PHONE_RIGHT = 18;
const SIDE_MARGIN = 22;

interface Props {
	area: SceneArea;
	topInset: number;
	animated: boolean;
}

/**
 * 공기계 영상을 내 폰으로 보는 장면 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 * @param animated 핀 애니메이션 실행 여부
 */
const PetcamSceneWatch = ({ area, topInset, animated }: Props) => {
	const { t } = useTranslation();

	const layout = getCoverLayout(area, 1080 / 1920, 0.48);
	const screenPoint = toScenePoint(layout, { x: 0.4, y: 0.645 });
	const phoneSize = getPhoneFrameSize(PHONE_SCALE);
	const phoneTop = topInset + 8;
	const linkEnd = { x: area.width - PHONE_RIGHT - phoneSize.width + 6, y: phoneTop + phoneSize.height * 0.42 };
	const tagMaxTop = area.height - radius.sheet - 90 - PHOTO_TAG_HEIGHT;

	return (
		<>
			<GuideSceneCoverPhoto source={photo} layout={layout} />
			<View style={styles.scrim} />

			{/*공기계에서 내 폰까지 잇는 점선*/}
			<Animated.View entering={FadeIn.delay(160)} style={StyleSheet.absoluteFill}>
				<Svg width="100%" height="100%">
					<Path
						d={`M ${screenPoint.x} ${screenPoint.y} Q ${screenPoint.x} ${linkEnd.y} ${linkEnd.x} ${linkEnd.y}`}
						fill="none"
						stroke={colors.onFilled}
						strokeWidth={2.5}
						strokeDasharray="6 7"
					/>
				</Svg>
			</Animated.View>

			<GuideScenePhotoPin x={screenPoint.x} y={screenPoint.y} animated={animated} />

			<View style={[styles.phone, { top: phoneTop, ...phoneSize }]}>
				<GuideScenePhoneFrame
					area={area}
					topInset={topInset}
					scale={PHONE_SCALE}
					isFullScreen
					style={styles.phoneFrame}
				>
					<PetcamSceneWatchPreview />
				</GuideScenePhoneFrame>
			</View>

			<GuideScenePhotoTag
				icon={TabletIcon}
				label={t('session.petcamGuide.watch.spareDevice')}
				variant="neutral"
				order={1}
				style={{
					top: Math.min(screenPoint.y + 44, tagMaxTop),
					left: SIDE_MARGIN,
					maxWidth: area.width - SIDE_MARGIN * 2,
				}}
			/>

			<GuideScenePhotoTag
				icon={SmartphoneIcon}
				label={t('session.petcamGuide.watch.myPhone')}
				variant="accent"
				order={2}
				style={{
					top: Math.min(phoneTop + phoneSize.height + 12, tagMaxTop),
					right: SIDE_MARGIN + 8,
					maxWidth: area.width - SIDE_MARGIN * 2,
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	scrim: { ...StyleSheet.absoluteFill, backgroundColor: sessionColors.videoScrim },
	phone: {
		position: 'absolute',
		right: PHONE_RIGHT,
		transform: [{ rotate: '5deg' }],
	},
	phoneFrame: { top: 0, left: 0 },
});

export default PetcamSceneWatch;
