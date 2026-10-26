import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans } from 'react-i18next';

import { formatDuration, formatMonth, formatWholeHours } from '@/i18n/format';

import dayjs from 'dayjs';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import FeedCardCalendarArt from '@/components/feed-card/calendar-art';
import FeedCardMilestoneBody, { milestoneStyles } from '@/components/feed-card/milestone-body';

interface Props {
	feedItem: FeedItem;
}

/**
 * 월 학습 시간 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardMonthlyLearningTimeBody = ({ feedItem }: Props) => {
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
			art=<FeedCardCalendarArt monthLabel={monthLabel} hoursText={formatWholeHours(thresholdMs)} />
		/>
	);
};

export default FeedCardMonthlyLearningTimeBody;
