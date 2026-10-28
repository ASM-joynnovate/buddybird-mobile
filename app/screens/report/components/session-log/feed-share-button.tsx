import { StyleSheet } from 'react-native';

import { useGetSettingsQuery } from '@/hooks/apis/settings';
import { useGetMeQuery } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import SessionLogFeedShareDialog from '@/screens/report/components/session-log/feed-share-dialog';
import type { LogItem } from '@/screens/report/utils/session-log';
import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/report';

import FeedConsentDialog from '@/components/feed-consent-dialog';
import { Button } from '@/components/ui/button';

interface Props {
	logItem: LogItem;
	wordName: string;
}

/**
 * 모사를 피드에 공유하는 버튼 컴포넌트
 * @param logItem 공유할 모사 기록
 * @param wordName 세션에서 학습한 단어
 */
const SessionLogFeedShareButton = ({ logItem, wordName }: Props) => {
	const { t } = useTranslation();

	const { data: meData } = useGetMeQuery();
	const { data: settingsData } = useGetSettingsQuery();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);
	const pendingFeedShareSoundId = useReportStore((state) => state.pendingFeedShareSoundId);

	const setPendingFeedShareSoundId = useReportStore((state) => state.setPendingFeedShareSoundId);

	const shareReady = pendingFeedShareSoundId === logItem.id && !isAnonymous && !!meData?.nickname;
	const feedEnabled = settingsData?.community.feed_enabled;

	const handleShareToFeed = () => {
		if (pendingFeedShareSoundId !== null) {
			return;
		}

		setPendingFeedShareSoundId(logItem.id);
	};

	return (
		<>
			<Button
				label={t(logItem.isFeedShared ? 'report.detail.sharedToFeed' : 'report.detail.shareToFeed')}
				variant="secondary"
				size="small"
				disabled={logItem.isFeedShared}
				onPress={handleShareToFeed}
				style={styles.button}
			/>

			<FeedConsentDialog
				visible={shareReady && feedEnabled === false}
				onClose={() => setPendingFeedShareSoundId(null)}
			/>

			<SessionLogFeedShareDialog
				visible={shareReady && feedEnabled === true}
				logItem={logItem}
				wordName={wordName}
				onClose={() => setPendingFeedShareSoundId(null)}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	button: { flex: 1 },
});

export default SessionLogFeedShareButton;
