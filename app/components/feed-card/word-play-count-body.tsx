import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans, useTranslation } from 'react-i18next';

import FeedCardMilestoneBody, { milestoneStyles } from '@/components/feed-card/milestone-body';
import FeedCardSpeakerArt from '@/components/feed-card/speaker-art';

interface Props {
	feedItem: FeedItem;
}

/**
 * 단어를 들려준 횟수 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardWordPlayCountBody = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const count = feedItem.threshold ?? 0;

	return (
		<FeedCardMilestoneBody
			message=<Trans
				i18nKey="community.feed.wordPlayCount"
				values={{ word: feedItem.word_name ?? '', count }}
				components={{ b: <Text style={milestoneStyles.emphasis} /> }}
			/>
			art=<FeedCardSpeakerArt countText={t('community.feed.artCount', { count })} />
		/>
	);
};

export default FeedCardWordPlayCountBody;
