import { StyleSheet } from 'react-native';

import type { SessionSound } from '@/types/apis/sessions';

import { useGetSettingsQuery } from '@/hooks/apis/settings';
import { useGetMeQuery } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import SessionLogFeedShareDialog from '@/screens/report/components/session-log/feed-share-dialog';
import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/report';

import FeedConsentDialog from '@/components/feed-consent-dialog';
import { Button } from '@/components/ui/button';

interface Props {
	sound: SessionSound;
	wordName: string;
}

/**
 * 모사를 피드에 공유하는 버튼 컴포넌트
 * @param sound 공유할 소리
 * @param wordName 세션에서 학습한 단어
 */
const SessionLogFeedShareButton = ({ sound, wordName }: Props) => {
	const { t } = useTranslation();

	const { data: meData } = useGetMeQuery();
	const { data: settingsData } = useGetSettingsQuery();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);
	const pendingFeedShareSoundId = useReportStore((state) => state.pendingFeedShareSoundId);

	const setPendingFeedShareSoundId = useReportStore((state) => state.setPendingFeedShareSoundId);

	const shareReady = pendingFeedShareSoundId === sound.id && !isAnonymous && !!meData?.nickname;
	const feedEnabled = settingsData?.community.feed_enabled;

	const handleShareToFeed = () => {
		if (pendingFeedShareSoundId !== null) {
			return;
		}

		setPendingFeedShareSoundId(sound.id);
	};

	return (
		<>
			<Button
				label={t(sound.is_feed_shared ? 'report.detail.sharedToFeed' : 'report.detail.shareToFeed')}
				variant="secondary"
				size="small"
				disabled={sound.is_feed_shared}
				onPress={handleShareToFeed}
				style={styles.button}
			/>

			<FeedConsentDialog
				visible={shareReady && feedEnabled === false}
				onClose={() => setPendingFeedShareSoundId(null)}
			/>

			<SessionLogFeedShareDialog
				visible={shareReady && feedEnabled === true}
				sound={sound}
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
