import { useCallback, useEffect, useMemo, useState } from 'react';

import { StyleSheet } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';
import {
	useGetSession,
	useGetSessionEventList,
	useGetSessionSoundList,
	useGetSessionSummary,
} from '@/hooks/apis/sessions';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import Animated, { useDerivedValue } from 'react-native-reanimated';

import SessionLog from '@/screens/report/components/session-log';
import SessionOverview from '@/screens/report/components/session-overview';
import { shouldShowDistressCall } from '@/services/remote-config/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { getLogItems, type LogItem } from '@/utils/session-log';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/components/buddy-refresh/options';
import RopeRefreshIndicator from '@/components/buddy-refresh/rope-indicator';
import SwingRefreshIndicator from '@/components/buddy-refresh/swing-indicator';
import ThrobberRefreshIndicator from '@/components/buddy-refresh/throbber-indicator';
import PullToRefreshContainer from '@/components/pull-to-refresh';

const CONTENT_PADDING_BOTTOM = 32;

interface Props {
	sessionId: string;
}

/**
 * 세션 상세 정보를 보이는 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionDetailContent = ({ sessionId }: Props) => {
	const queryClient = useQueryClient();

	const lowPerformance = useIsLowPerformance();

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const distressCallShown = shouldShowDistressCall();

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

	const [openItemId, setOpenItemId] = useState<string | null>(null);

	const items = useMemo(
		() =>
			getLogItems(
				sessionSoundListData.pages.flatMap((soundPage) => soundPage.data),
				sessionEventListData.filter((event) => distressCallShown || event.kind !== 'distress_call_detected'),
			),
		[distressCallShown, sessionEventListData, sessionSoundListData],
	);
	const emergencyCount = items.filter(
		(item) => item.kind === 'distressCall' || item.kind === 'parrotDisappeared',
	).length;

	const refetchSessionDetail = useCallback(
		() => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.detail(sessionId) }),
		[queryClient, sessionId],
	);

	useRefreshOnFocus(refetchSessionDetail);

	const { pullToRefresh, scrollProps } = usePullToRefresh<Animated.ScrollView>({
		onRefresh: () => {
			setPullToRefreshUsed(true);

			return refetchSessionDetail();
		},
		holdHeight: BUDDY_REFRESH_HEIGHT,
		minRefreshMs: BUDDY_REFRESH_MIN_MS,
		finishMs: BUDDY_REFRESH_FINISH_MS,
	});

	const { scrollY, viewportHeight, contentHeight } = pullToRefresh;
	const logBottom = useDerivedValue(() => contentHeight.get() - CONTENT_PADDING_BOTTOM);

	/** 소리 목록의 다음 쪽이 있으면 끝까지 이어서 조회 */
	useEffect(() => {
		if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) {
			return;
		}

		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

	const handleToggleItem = useCallback((item: LogItem) => {
		setOpenItemId((openId) => (openId === item.id ? null : item.id));
	}, []);

	return (
		<PullToRefreshContainer
			style={styles.viewport}
			indicatorStyle={styles.refreshIndicator}
			pullToRefresh={pullToRefresh}
			indicatorComponents={
				lowPerformance ? [ThrobberRefreshIndicator] : [SwingRefreshIndicator, RopeRefreshIndicator]
			}
		>
			<Animated.ScrollView
				{...scrollProps}
				showsVerticalScrollIndicator={false}
				style={[styles.list, scrollProps.style]}
				contentContainerStyle={styles.content}
			>
				<SessionOverview
					session={sessionData}
					sessionSummary={sessionSummaryData}
					emergencyCount={emergencyCount}
				/>

				<SessionLog
					session={sessionData}
					items={items}
					openItemId={openItemId}
					wordName={sessionSummaryData.word.name}
					scrollY={scrollY}
					viewportHeight={viewportHeight}
					logBottom={logBottom}
					onToggleItem={handleToggleItem}
				/>
			</Animated.ScrollView>
		</PullToRefreshContainer>
	);
};

const styles = StyleSheet.create({
	viewport: { marginHorizontal: -24 },
	refreshIndicator: { right: 24, left: 24 },
	list: { flex: 1 },
	content: { paddingHorizontal: 24, paddingBottom: CONTENT_PADDING_BOTTOM },
});

export default SessionDetailContent;
