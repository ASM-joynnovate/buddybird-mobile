import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans } from 'react-i18next';

import { formatDuration, formatWholeHours } from '@/i18n/format';

import FeedCardMedalArt from '@/screens/community/components/feed-card/medal-art';
import FeedCardMilestoneBody, { milestoneStyles } from '@/screens/community/components/feed-card/milestone-body';
import { useDeviceSettingsStore } from '@/stores/device-settings';

interface Props {
	feedItem: FeedItem;
}

/**
 * 총 학습 시간 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardTotalLearningTimeBody = ({ feedItem }: Props) => {
	const locale = useDeviceSettingsStore((state) => state.locale);

	const thresholdMs = feedItem.threshold ?? 0;

	return (
		<FeedCardMilestoneBody
			message=<Trans
				i18nKey="community.feed.totalLearningTime"
				values={{ duration: formatDuration(thresholdMs, locale) }}
				components={{ b: <Text style={milestoneStyles.emphasis} /> }}
			/>
			art=<FeedCardMedalArt hoursText={formatWholeHours(thresholdMs)} />
		/>
	);
};

export default FeedCardTotalLearningTimeBody;
