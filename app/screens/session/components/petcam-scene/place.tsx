import { StyleSheet } from 'react-native';

import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { ScanIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme';

import GuideSceneCoverPhoto, { getCoverLayout, toScenePoint } from '@/components/guide-scene/cover-photo';
import GuideScenePhotoPin from '@/components/guide-scene/photo-pin';
import GuideScenePhotoTag, { PHOTO_TAG_HEIGHT } from '@/components/guide-scene/photo-tag';

const photo: number = require('@assets/images/petcam-guide/place.jpg');

const LEADER_LENGTH = 60;
const LEADER_ANGLE = (20 * Math.PI) / 180;

const SIDE_MARGIN = 14;

interface Props {
	area: SceneArea;
	animated: boolean;
}

/**
 * 새장 앞에 둔 기기 사진 장면 컴포넌트
 * @param area 장면 영역
 * @param animated 핀 애니메이션 실행 여부
 */
const PetcamScenePlace = ({ area, animated }: Props) => {
	const { t } = useTranslation();

	const layout = getCoverLayout(area, 1080 / 1920, 0.48);
	const screenPoint = toScenePoint(layout, { x: 0.57, y: 0.645 });
	const leaderEnd = {
		x: screenPoint.x + LEADER_LENGTH * Math.sin(LEADER_ANGLE),
		y: screenPoint.y - LEADER_LENGTH * Math.cos(LEADER_ANGLE),
	};
	const calloutRight = Math.max(SIDE_MARGIN, area.width - (leaderEnd.x + 97));

	return (
		<>
			<GuideSceneCoverPhoto source={photo} layout={layout} />

			{/*핀에서 태그까지 잇는 선*/}
			<Animated.View entering={FadeIn.delay(160)} style={StyleSheet.absoluteFill}>
				<Svg width="100%" height="100%">
					<Line
						x1={screenPoint.x}
						y1={screenPoint.y}
						x2={leaderEnd.x}
						y2={leaderEnd.y}
						stroke={colors.onFilled}
						strokeWidth={2}
					/>
				</Svg>
			</Animated.View>

			<GuideScenePhotoPin x={screenPoint.x} y={screenPoint.y} animated={animated} />

			<GuideScenePhotoTag
				icon={ScanIcon}
				label={t('session.petcamGuide.place.wholeCage')}
				variant="neutral"
				order={1}
				style={{
					top: leaderEnd.y + 4 - PHOTO_TAG_HEIGHT,
					right: calloutRight,
					maxWidth: area.width - SIDE_MARGIN * 2,
				}}
			/>
		</>
	);
};

export default PetcamScenePlace;
