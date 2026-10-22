import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans, useTranslation } from 'react-i18next';

import { formatDuration, formatMonth } from '@/i18n/format';

import dayjs from 'dayjs';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { HOUR } from '@/config/units';
import FeedCardMilestoneBody, { milestoneStyles } from '@/screens/community/components/feed-card/milestone-body';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

interface Props {
	feedItem: FeedItem;
}

/**
 * 월 학습 시간 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardMonthlyLearningTimeBody = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const thresholdMs = feedItem.threshold ?? 0;
	const month = formatMonth(dayjs.utc(feedItem.created_at));
	const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);

	return (
		<FeedCardMilestoneBody
			message=<Trans
				i18nKey="community.feed.monthlyLearningTime"
				values={{ month, duration: formatDuration(thresholdMs, locale) }}
				components={{ b: <Text style={milestoneStyles.emphasis} /> }}
			/>
			art=<Svg width={64} height={67} viewBox="0 0 92 96" accessible={false}>
				<Rect x={6} y={12} width={80} height={80} rx={16} fill={colors.greenDark} />
				<Rect
					x={6}
					y={10}
					width={80}
					height={76}
					rx={16}
					fill={colors.background}
					stroke={colors.green}
					strokeWidth={4}
				/>
				<Path d="M6 26a16 16 0 0 1 16-16h48a16 16 0 0 1 16 16v6H6Z" fill={colors.green} />
				<Rect x={24} y={2} width={8} height={18} rx={4} fill={colors.greenDark} />
				<Rect x={60} y={2} width={8} height={18} rx={4} fill={colors.greenDark} />
				<SvgText x={46} y={29} textAnchor="middle" fontFamily={font.black} fontSize={12} fill={colors.onFilled}>
					{monthLabel}
				</SvgText>
				<SvgText x={46} y={66} textAnchor="middle" fontFamily={font.black} fontSize={28} fill={colors.text}>
					{String(Math.floor(thresholdMs / HOUR))}
				</SvgText>
				<SvgText
					x={46}
					y={80}
					textAnchor="middle"
					fontFamily={font.extraBold}
					fontSize={10}
					fill={colors.muted}
				>
					{t('community.feed.artHours')}
				</SvgText>
			</Svg>
		/>
	);
};

export default FeedCardMonthlyLearningTimeBody;
