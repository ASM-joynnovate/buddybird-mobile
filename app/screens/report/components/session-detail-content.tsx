import { useEffect, useMemo, useState } from 'react';

import type { PullToRefreshState } from '@/types/pull-to-refresh';

import {
	useGetSession,
	useGetSessionEventList,
	useGetSessionSoundList,
	useGetSessionSummary,
} from '@/hooks/apis/sessions';

import { useDerivedValue } from 'react-native-reanimated';

import SessionLog from '@/screens/report/components/session-log';
import { getLogItems, type LogItem } from '@/screens/report/utils/session-log';
import { shouldShowDistressCall } from '@/services/remote-config/client';

import SessionOverview from '@/components/session/session-overview';

export const CONTENT_PADDING_BOTTOM = 32;

interface Props {
	sessionId: string;
	pullToRefresh: PullToRefreshState;
}

/**
 * 세션 상세 정보 컴포넌트
 * @param sessionId 세션 ID
 * @param pullToRefresh 화면 스크롤의 당기기 상태
 */
const SessionDetailContent = ({ sessionId, pullToRefresh }: Props) => {
	const [openItemId, setOpenItemId] = useState<string | null>(null);

	const { data: sessionData } = useGetSession({ id: sessionId });
	const { data: sessionSummaryData } = useGetSessionSummary({ id: sessionId });
	const {
		data: sessionSoundListData,
		hasNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
		fetchNextPage,
	} = useGetSessionSoundList({ id: sessionId });
	const { data: sessionEventListData } = useGetSessionEventList({ id: sessionId });

	const distressCallShown = shouldShowDistressCall();

	const logItems = useMemo(
		() =>
			getLogItems(
				sessionSoundListData.pages.flatMap((soundPage) => soundPage.data),
				sessionEventListData.filter((event) => distressCallShown || event.kind !== 'distress_call_detected'),
			),
		[distressCallShown, sessionEventListData, sessionSoundListData],
	);
	const emergencyCount = logItems.filter(
		(logItem) => logItem.kind === 'distressCall' || logItem.kind === 'parrotDisappeared',
	).length;

	const { scrollY, viewportHeight, contentHeight } = pullToRefresh;
	const logBottom = useDerivedValue(() => contentHeight.get() - CONTENT_PADDING_BOTTOM);

	/** 소리 목록의 다음 페이지를 끝까지 이어서 조회 */
	useEffect(() => {
		if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) {
			return;
		}

		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

	const handleToggleItem = (logItem: LogItem) => {
		setOpenItemId((prev) => (prev === logItem.id ? null : logItem.id));
	};

	return (
		<>
			<SessionOverview
				learningMs={sessionSummaryData.session.active.duration_ms}
				wordName={sessionSummaryData.word.name}
				mimicCount={sessionData.sounds.mimic_count}
				emergencyCount={emergencyCount}
			/>

			<SessionLog
				session={sessionData}
				logItems={logItems}
				openItemId={openItemId}
				wordName={sessionSummaryData.word.name}
				scrollY={scrollY}
				viewportHeight={viewportHeight}
				logBottom={logBottom}
				onToggleItem={handleToggleItem}
			/>
		</>
	);
};

export default SessionDetailContent;
