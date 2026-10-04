import { useDeferredValue, useEffect, useRef, useState } from 'react';

import { FlatList, StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { ReportStackParamList } from '@/types/navigation';

import { getReportOptions } from '@/hooks/apis/reports';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import { useTranslation } from 'react-i18next';

import { formatMonthDayWeekday } from '@/i18n/format';

import { type RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import dayjs from 'dayjs';

import ReportHeader from '@/screens/report/components/report-header';
import SessionItem from '@/screens/report/components/session-item';
import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { periodsBetween } from '@/utils/date';
import { latestStart, periodSelectionFromParams, shiftedStart } from '@/utils/report-period';

import { Copy } from '@/components/ui/copy';
import { EmptyState } from '@/components/ui/empty-state';

/** 리포트 목록 컴포넌트 */
const ReportContent = () => {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();
	const screenFocused = useIsFocused();

	const trackedPeriodRef = useRef<string | null>(null);
	const trackedNotificationParamsRef = useRef<object | null>(null);

	const [refetchingByUser, setRefetchingByUser] = useState(false);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);

	const selectedStart = start ?? latestStart(period);

	const deferredPeriod = useDeferredValue(period);
	const deferredStart = useDeferredValue(selectedStart);

	// 같은 기간 단위 안에서 넘길 때는 새 기간을 불러올 때까지 이전 내용을 유지
	const shownStart = deferredPeriod === period ? deferredStart : selectedStart;

	const { data: reportData, refetch } = useSuspenseQuery(getReportOptions({ period, start: shownStart }));

	useRefreshOnFocus(refetch);
	const { data: previousReportData } = useSuspenseQuery(
		getReportOptions({ period, start: shiftedStart(period, shownStart, -1) }),
	);

	const selectedPeriodShown = shownStart === selectedStart;
	const periodsAgo = periodsBetween(period, selectedStart, latestStart(period));

	const header = <ReportHeader report={reportData} previousReport={previousReportData} />;

	// 아래로 당겨 새로고침할 때만 로딩 표시
	const handleRefresh = async () => {
		setRefetchingByUser(true);

		try {
			await refetch();
		} finally {
			setRefetchingByUser(false);
		}
	};

	/** 리포트 기간별로 report_viewed 이벤트를 한 번 전송 */
	useEffect(() => {
		if (!screenFocused) {
			trackedPeriodRef.current = null;

			return;
		}

		const shownPeriodKey = `${period}:${selectedStart}`;
		const openedFromNotification =
			route.params?.source === 'notification' && trackedNotificationParamsRef.current !== route.params;

		if (!selectedPeriodShown || (trackedPeriodRef.current === shownPeriodKey && !openedFromNotification)) {
			return;
		}

		if (openedFromNotification) {
			const notificationPeriod = periodSelectionFromParams(route.params);

			if (notificationPeriod.period !== period || notificationPeriod.start !== selectedStart) {
				return;
			}
		}

		trackedPeriodRef.current = shownPeriodKey;
		trackedNotificationParamsRef.current = route.params ?? null;

		track('report_viewed', {
			period,
			periods_ago: periodsAgo,
			source: openedFromNotification ? 'notification' : 'tab',
			session_count: reportData.sessions.length,
		});
	}, [period, selectedStart, screenFocused, selectedPeriodShown, periodsAgo, reportData, route.params]);

	return (
		<FlatList
			data={reportData.sessions}
			keyExtractor={(session) => session.id}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
			refreshing={refetchingByUser}
			onRefresh={() => void handleRefresh()}
			ListHeaderComponent={header}
			ListEmptyComponent=<EmptyState message={t('report.empty')} />
			renderItem={({ item: session, index }) => {
				const dayStarted =
					period !== 'day' &&
					(index === 0 ||
						!dayjs(session.period.started_at).isSame(
							reportData.sessions[index - 1].period.started_at,
							'day',
						));

				return (
					<View style={styles.sessionContainer}>
						{/*학습 목록의 날짜 소제목*/}
						{dayStarted && (
							<Copy accessibilityRole="header" style={[styles.date, index > 0 && styles.laterDate]}>
								{formatMonthDayWeekday(session.period.started_at, locale)}
							</Copy>
						)}

						<SessionItem session={session} period={period} order={index} />
					</View>
				);
			}}
		/>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		paddingTop: 12,
		paddingBottom: 24,
		gap: 10,
	},
	sessionContainer: { gap: 10 },
	date: { fontFamily: font.extraBold, fontSize: 12.5, lineHeight: 18, color: colors.muted },
	laterDate: { marginTop: 8 },
});

export default ReportContent;
