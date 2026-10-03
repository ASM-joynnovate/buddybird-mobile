import { useDeferredValue, useEffect, useRef } from 'react';

import { FlatList, StyleSheet } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { ReportStackParamList } from '@/types/navigation';

import { getReportOptions } from '@/hooks/apis/reports';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';

import { SCREEN_REFRESH_MS } from '@/config';
import ReportHeader from '@/screens/report/components/report-header';
import SessionItem from '@/screens/report/components/session-item';
import { track } from '@/services/telemetry/client';
import { useReportStore } from '@/stores/report';
import { periodsBetween } from '@/utils/date';
import { latestStart, periodSelectionFromParams } from '@/utils/report-period';

/** 리포트 목록 컴포넌트 */
const ReportContent = () => {
	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();
	const screenFocused = useIsFocused();

	const trackedPeriodRef = useRef<string | null>(null);
	const trackedNotificationParamsRef = useRef<object | null>(null);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);

	const selectedStart = start ?? latestStart(period);

	const deferredPeriod = useDeferredValue(period);
	const deferredStart = useDeferredValue(selectedStart);

	const {
		data: reportData,
		isRefetching,
		refetch,
	} = useSuspenseQuery({
		...getReportOptions({ period: deferredPeriod, start: deferredStart }),
		refetchInterval: (query) =>
			screenFocused && query.state.data?.sessions.some((session) => session.judgment.status === 'pending')
				? SCREEN_REFRESH_MS
				: false,
	});

	const isSelectedPeriodShown = deferredPeriod === period && deferredStart === selectedStart;
	const periodsAgo = periodsBetween(period, selectedStart, latestStart(period));

	const header = <ReportHeader report={reportData} />;

	/** 리포트 기간별로 report_viewed 이벤트를 한 번 전송 */
	useEffect(() => {
		if (!screenFocused) {
			trackedPeriodRef.current = null;

			return;
		}

		const shownPeriodKey = `${deferredPeriod}:${deferredStart}`;
		const openedFromNotification =
			route.params?.source === 'notification' && trackedNotificationParamsRef.current !== route.params;

		if (!isSelectedPeriodShown || (trackedPeriodRef.current === shownPeriodKey && !openedFromNotification)) {
			return;
		}

		if (openedFromNotification) {
			const notificationPeriod = periodSelectionFromParams(route.params);

			if (notificationPeriod.period !== deferredPeriod || notificationPeriod.start !== deferredStart) {
				return;
			}
		}

		trackedPeriodRef.current = shownPeriodKey;
		trackedNotificationParamsRef.current = route.params ?? null;

		track('report_viewed', {
			period: deferredPeriod,
			periods_ago: periodsAgo,
			source: openedFromNotification ? 'notification' : 'tab',
			session_count: reportData.sessions.length,
		});
	}, [deferredPeriod, deferredStart, screenFocused, isSelectedPeriodShown, periodsAgo, reportData, route.params]);

	return (
		<FlatList
			data={reportData.sessions}
			keyExtractor={(session) => session.id}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
			refreshing={isRefetching}
			onRefresh={() => void refetch()}
			ListHeaderComponent={header}
			renderItem={({ item: session }) => <SessionItem session={session} />}
		/>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 12,
		paddingBottom: 24,
		gap: 10,
	},
});

export default ReportContent;
