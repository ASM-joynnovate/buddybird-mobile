import { useEffect, useMemo, useState, useTransition } from 'react';

import type { PullToRefreshState } from '@/types/pull-to-refresh';
import type { LogFilter } from '@/types/session-log';

import { useGetSession, useGetSessionLog, useGetSessionSummary } from '@/hooks/apis/sessions';

import { useDerivedValue } from 'react-native-reanimated';

import SessionLog from '@/screens/report/components/session-log';
import { type LogItem, logFilterKinds, toLogItem } from '@/screens/report/utils/session-log';

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
	const [, startFilterTransition] = useTransition();

	const [openItemId, setOpenItemId] = useState<string | null>(null);
	const [logFilter, setLogFilter] = useState<LogFilter>('all');

	const { data: sessionData } = useGetSession({ id: sessionId });
	const { data: sessionSummaryData } = useGetSessionSummary({ id: sessionId });
	const {
		data: sessionLogData,
		hasNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
		fetchNextPage,
	} = useGetSessionLog({ id: sessionId, kinds: logFilterKinds[logFilter] });

	const logItems = useMemo(
		() => sessionLogData.pages.flatMap((logPage) => logPage.data).map(toLogItem),
		[sessionLogData],
	);
	const emergencyCount =
		sessionData.events.distress_call_count +
		sessionData.events.parrot_disappeared_count +
		sessionData.events.parrot_motionless_count;

	const { scrollY, viewportHeight, contentHeight } = pullToRefresh;
	const logBottom = useDerivedValue(() => contentHeight.get() - CONTENT_PADDING_BOTTOM);

	/** 기록의 다음 페이지를 끝까지 이어서 조회 */
	useEffect(() => {
		if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) {
			return;
		}

		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

	/** 필터 변경 중 이전 기록 유지 */
	const handleSelectFilter = (selectedFilter: LogFilter) => {
		startFilterTransition(() => setLogFilter(selectedFilter));
	};

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
				logFilter={logFilter}
				openItemId={openItemId}
				wordName={sessionSummaryData.word.name}
				scrollY={scrollY}
				viewportHeight={viewportHeight}
				logBottom={logBottom}
				onSelectFilter={handleSelectFilter}
				onToggleItem={handleToggleItem}
			/>
		</>
	);
};

export default SessionDetailContent;
