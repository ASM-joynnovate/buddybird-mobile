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
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import Animated, { useAnimatedRef, useScrollOffset, useSharedValue } from 'react-native-reanimated';

import SessionLog from '@/screens/report/components/session-log';
import SessionOverview from '@/screens/report/components/session-overview';
import { shouldShowDistressCall } from '@/services/remote-config/client';
import { getLogItems, type LogItem } from '@/utils/session-log';

interface Props {
	sessionId: string;
}

/**
 * 세션 상세 정보를 보이는 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionDetailContent = ({ sessionId }: Props) => {
	const queryClient = useQueryClient();

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

	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollY = useScrollOffset(scrollRef);
	const viewportHeight = useSharedValue(0);

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
		<Animated.ScrollView
			ref={scrollRef}
			showsVerticalScrollIndicator={false}
			scrollEventThrottle={16}
			style={styles.viewport}
			contentContainerStyle={styles.content}
			onLayout={(event) => viewportHeight.set(event.nativeEvent.layout.height)}
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
				onToggleItem={handleToggleItem}
			/>
		</Animated.ScrollView>
	);
};

const styles = StyleSheet.create({
	viewport: { flex: 1, marginHorizontal: -24 },
	content: { paddingHorizontal: 24, paddingBottom: 32 },
});

export default SessionDetailContent;
