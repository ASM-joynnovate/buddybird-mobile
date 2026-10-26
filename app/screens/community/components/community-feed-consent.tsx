import { useState } from 'react';

import { useGetSettingsQuery } from '@/hooks/apis/settings';

import FeedConsentDialog from '@/components/feed-consent-dialog';

// 앱을 실행한 동안 동의 다이얼로그를 닫았는지 여부
let feedConsentClosed = false;

/** 피드 공개를 끈 사용자에게 앱 실행마다 한 번 띄우는 공개 동의 컴포넌트 */
const CommunityFeedConsent = () => {
	const [dialogClosed, setDialogClosed] = useState(feedConsentClosed);

	const { data: settingsData } = useGetSettingsQuery();

	const dialogVisible = !dialogClosed && settingsData?.community.feed_enabled === false;

	const handleClose = () => {
		feedConsentClosed = true;
		setDialogClosed(true);
	};

	return <FeedConsentDialog visible={dialogVisible} onClose={handleClose} />;
};

export default CommunityFeedConsent;
