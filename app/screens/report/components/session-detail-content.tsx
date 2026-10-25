import { useCallback, useEffect, useMemo, useState } from 'react';

import { StyleSheet } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { sessionKeys } from '@/hooks/apis/keys/sessions';
import {
	useGetSession,
	useGetSessionEventList,
	useGetSessionSoundList,
	useGetSessionSummary,
} from '@/hooks/apis/sessions';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import Animated, { useDerivedValue } from 'react-native-reanimated';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/screens/report/components/buddy-refresh/options';
import BuddyRefreshRopeIndicator from '@/screens/report/components/buddy-refresh/rope-indicator';
import BuddyRefreshSwingIndicator from '@/screens/report/components/buddy-refresh/swing-indicator';
import BuddyRefreshThrobberIndicator from '@/screens/report/components/buddy-refresh/throbber-indicator';
import PullToRefreshContainer from '@/screens/report/components/pull-to-refresh-container';
import SessionLog from '@/screens/report/components/session-log';
import useIsLowPerformance from '@/screens/report/hooks/use-is-low-performance';
import usePullToRefresh from '@/screens/report/hooks/use-pull-to-refresh';
import { getLogItems, type LogItem } from '@/screens/report/utils/session-log';
import { shouldShowDistressCall } from '@/services/remote-config/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import SessionOverview from '@/components/session/session-overview';

const CONTENT_PADDING_BOTTOM = 32;

interface Props {
	sessionId: string;
}

/**
 * 세션 상세 정보 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionDetailContent = ({ sessionId }: Props) => {
	const queryClient = useQueryClient();

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

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const lowPerformance = useIsLowPerformance();

	/** 세션 상세 새로고침 함수 */
	const refetchSessionDetail = useCallback(
		() => queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) }),
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
		(item) => item.kind === 'distressCall' || item.kind === 'parrotDisappeared',
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

	const handleToggleItem = (item: LogItem) => {
		setOpenItemId((prev) => (prev === item.id ? null : item.id));
	};

	return (
		<PullToRefreshContainer
			style={styles.viewport}
			indicatorStyle={styles.refreshIndicator}
			pullToRefresh={pullToRefresh}
			indicatorComponents={
				lowPerformance
					? [BuddyRefreshThrobberIndicator]
					: [BuddyRefreshSwingIndicator, BuddyRefreshRopeIndicator]
			}
		>
			<Animated.ScrollView
				{...scrollProps}
				showsVerticalScrollIndicator={false}
				style={[styles.list, scrollProps.style]}
				contentContainerStyle={styles.content}
			>
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
