import { StyleSheet } from 'react-native';

import type { SceneArea } from '@/types/scene';

import { useTranslation } from 'react-i18next';

import { PlugIcon, TabletIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { colors, radius } from '@/theme';

import UsageSceneCoverPhoto, {
	getCoverLayout,
	toScenePoint,
} from '@/components/app/usage-guide/usage-scene/cover-photo';
import UsageScenePhotoPin from '@/components/app/usage-guide/usage-scene/photo-pin';
import UsageScenePhotoTag, { PHOTO_TAG_HEIGHT } from '@/components/app/usage-guide/usage-scene/photo-tag';

const photo: number = require('@assets/images/usage-guide/place.jpg');

const LEADER_LENGTH = 60;
const LEADER_ANGLE = (20 * Math.PI) / 180;

const SIDE_MARGIN = 14;
const CHARGER_LEFT = 20;

interface Props {
	area: SceneArea;
	animated: boolean;
}

/**
 * 새장에 둔 기기 사진 장면 컴포넌트
 * @param area 장면 영역
 * @param animated 핀 애니메이션 실행 여부
 */
const UsageScenePlace = ({ area, animated }: Props) => {
	const { t } = useTranslation();

	const layout = getCoverLayout(area, 1080 / 1920, 0.48);
	const tablet = toScenePoint(layout, { x: 0.6667, y: 0.5506 });
	const chargerTop = Math.min(
		layout.top + layout.height * 0.7166,
		area.height - radius.sheet - 90 - PHOTO_TAG_HEIGHT,
	);
	const leaderEnd = {
		x: tablet.x + LEADER_LENGTH * Math.sin(LEADER_ANGLE),
		y: tablet.y - LEADER_LENGTH * Math.cos(LEADER_ANGLE),
	};
	const calloutRight = Math.max(SIDE_MARGIN, area.width - (leaderEnd.x + 97));

	return (
		<>
			<UsageSceneCoverPhoto source={photo} layout={layout} />

			{/*핀에서 태그까지 잇는 선*/}
			<Animated.View entering={FadeIn.delay(160)} style={StyleSheet.absoluteFill}>
				<Svg width="100%" height="100%">
					<Line
						x1={tablet.x}
						y1={tablet.y}
						x2={leaderEnd.x}
						y2={leaderEnd.y}
						stroke={colors.onFilled}
						strokeWidth={2}
					/>
				</Svg>
			</Animated.View>

			<UsageScenePhotoPin x={tablet.x} y={tablet.y} animated={animated} />

			<UsageScenePhotoTag
				icon={TabletIcon}
				label={t('onboarding.usage.place.spareDevice')}
				variant="neutral"
				order={1}
				style={{
					top: leaderEnd.y + 4 - PHOTO_TAG_HEIGHT,
					right: calloutRight,
					maxWidth: area.width - SIDE_MARGIN * 2,
				}}
			/>

			<UsageScenePhotoTag
				icon={PlugIcon}
				label={t('onboarding.usage.place.charger')}
				variant="inverse"
				order={2}
				style={{ top: chargerTop, left: CHARGER_LEFT, maxWidth: area.width - CHARGER_LEFT * 2 }}
			/>
		</>
	);
};

export default UsageScenePlace;
