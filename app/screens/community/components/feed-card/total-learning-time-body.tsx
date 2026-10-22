import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans, useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { HOUR } from '@/config/units';
import FeedCardMilestoneBody, { milestoneStyles } from '@/screens/community/components/feed-card/milestone-body';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

interface Props {
	feedItem: FeedItem;
}

/**
 * 총 학습 시간 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardTotalLearningTimeBody = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const thresholdMs = feedItem.threshold ?? 0;
	const thresholdHoursText = String(Math.floor(thresholdMs / HOUR));

	return (
		<FeedCardMilestoneBody
			message=<Trans
				i18nKey="community.feed.totalLearningTime"
				values={{ duration: formatDuration(thresholdMs, locale) }}
				components={{ b: <Text style={milestoneStyles.emphasis} /> }}
			/>
			art=<Svg width={64} height={74} viewBox="0 0 76 88" accessible={false}>
				<Path d="M24 52 15 84l11-5 6 9 7-29Z" fill={colors.blueDark} />
				<Path d="M52 52l9 32-11-5-6 9-7-29Z" fill={colors.blueDark} />
				<Circle cx={38} cy={34} r={31} fill={colors.blueDark} />
				<Circle cx={38} cy={34} r={27} fill={colors.blue} />
				<Circle
					cx={38}
					cy={34}
					r={22}
					fill="none"
					stroke={colors.onFilled}
					strokeOpacity={0.5}
					strokeWidth={2}
					strokeDasharray="2 4"
				/>
				<SvgText
					x={38}
					y={38}
					textAnchor="middle"
					fontFamily={font.black}
					fontSize={thresholdHoursText.length > 3 ? 17 : 22}
					fill={colors.onFilled}
				>
					{thresholdHoursText}
				</SvgText>
				<SvgText
					x={38}
					y={51}
					textAnchor="middle"
					fontFamily={font.extraBold}
					fontSize={10}
					fill={colors.onFilled}
				>
					{t('community.feed.artHours')}
				</SvgText>
			</Svg>
		/>
	);
};

export default FeedCardTotalLearningTimeBody;
