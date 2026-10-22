import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { PlugIcon, TabletIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import { colors, radius } from '@/theme';

import CoverPhoto, { getCoverLayout, toScenePoint } from '@/components/app/usage-guide-screen/usage-scene/cover-photo';
import PhotoPin from '@/components/app/usage-guide-screen/usage-scene/photo-pin';
import PhotoTag from '@/components/app/usage-guide-screen/usage-scene/photo-tag';
import type { SceneArea } from '@/components/scene-stage';

const photo: number = require('@assets/images/onboarding/usage-place.jpg');

const PHOTO_ASPECT_RATIO = 1080 / 1920;
const PHOTO_FOCUS_Y = 0.48;
/** 새장 위 태블릿 화면 */
const TABLET_POINT = { x: 0.6667, y: 0.5506 };
/** 새장 윗면 높이 */
const CAGE_TOP_Y = 0.7166;
const LEADER_LENGTH = 60;
const LEADER_ANGLE = (20 * Math.PI) / 180;
const CALLOUT_HEIGHT = 28;
const CALLOUT_OVERLAP = 4;
const CALLOUT_RIGHT_PAST_LEADER = 97;
const SIDE_MARGIN = 14;
const CHARGER_LEFT = 20;
/** 시트 위로 튀어나온 버디를 피하려고 태그 아래에 남기는 높이 */
const MASCOT_CLEARANCE = 90;

interface Props {
	area: SceneArea;
	animated: boolean;
}

/**
 * 충전기에 연결한 안 쓰는 기기가 새장 위에서 학습 중인 사진 장면 컴포넌트
 * @param area 장면 영역
 * @param animated 핀 움직임 실행 여부
 */
const UsageScenePlace = ({ area, animated }: Props) => {
	const { t } = useTranslation();

	const layout = getCoverLayout(area, PHOTO_ASPECT_RATIO, PHOTO_FOCUS_Y);
	const tablet = toScenePoint(layout, TABLET_POINT);
	const chargerTop = Math.min(
		toScenePoint(layout, { x: 0, y: CAGE_TOP_Y }).y,
		area.height - radius.sheet - MASCOT_CLEARANCE - CALLOUT_HEIGHT,
	);
	const leaderEnd = {
		x: tablet.x + LEADER_LENGTH * Math.sin(LEADER_ANGLE),
		y: tablet.y - LEADER_LENGTH * Math.cos(LEADER_ANGLE),
	};
	const calloutRight = Math.max(SIDE_MARGIN, area.width - (leaderEnd.x + CALLOUT_RIGHT_PAST_LEADER));

	return (
		<>
			<CoverPhoto source={photo} layout={layout} />

			{/*핀에서 콜아웃까지 잇는 선*/}
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

			<PhotoPin point={tablet} animated={animated} />

			<PhotoTag
				icon={TabletIcon}
				label={t('onboarding.usage.place.spareDevice')}
				variant="light"
				order={1}
				style={{
					top: leaderEnd.y + CALLOUT_OVERLAP - CALLOUT_HEIGHT,
					right: calloutRight,
					maxWidth: area.width - SIDE_MARGIN * 2,
				}}
			/>

			<PhotoTag
				icon={PlugIcon}
				label={t('onboarding.usage.place.charger')}
				variant="dark"
				order={2}
				style={{ top: chargerTop, left: CHARGER_LEFT, maxWidth: area.width - CHARGER_LEFT * 2 }}
			/>
		</>
	);
};

export default UsageScenePlace;
