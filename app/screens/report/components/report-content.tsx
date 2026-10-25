import { useDeferredValue, useEffect, useRef } from 'react';

import { type ListRenderItemInfo, StyleSheet, View } from 'react-native';

import type { ReportSession } from '@/types/apis/reports';

import { useGetReport } from '@/hooks/apis/reports';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import { useTranslation } from 'react-i18next';

import { formatMonthDayWeekday } from '@/i18n/format';

import { useIsFocused } from '@react-navigation/native';
import dayjs from 'dayjs';
import Animated from 'react-native-reanimated';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/screens/report/components/buddy-refresh/constants';
import BuddyRefreshRopeIndicator from '@/screens/report/components/buddy-refresh/rope-indicator';
import BuddyRefreshSwingIndicator from '@/screens/report/components/buddy-refresh/swing-indicator';
import BuddyRefreshThrobberIndicator from '@/screens/report/components/buddy-refresh/throbber-indicator';
import PullToRefreshContainer from '@/screens/report/components/pull-to-refresh-container';
import ReportHeader from '@/screens/report/components/report-header';
import SessionItem from '@/screens/report/components/session-item';
import useIsLowPerformance from '@/screens/report/hooks/use-is-low-performance';
import usePullToRefresh from '@/screens/report/hooks/use-pull-to-refresh';
import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { periodsBetween } from '@/utils/date';
import { latestStart, shiftedStart } from '@/utils/report-period';

import { Copy } from '@/components/ui/copy';
import { EmptyState } from '@/components/ui/empty-state';

/** 리포트 목록 컴포넌트 */
const ReportContent = () => {
	const { t } = useTranslation();

	const screenFocused = useIsFocused();

	const trackedPeriodRef = useRef<string | null>(null);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);

	const selectedStart = start ?? latestStart(period);

	const deferredPeriod = useDeferredValue(period);
	const deferredStart = useDeferredValue(selectedStart);

	// 같은 기간 단위에서는 이전 내용 유지
	const shownStart = deferredPeriod === period ? deferredStart : selectedStart;

	const { data: reportData, refetch } = useGetReport({ period, start: shownStart });
	// 바로 전 기간 리포트도 받은 뒤 화면 표시
	useGetReport({ period, start: shiftedStart(period, shownStart, -1) });

	const locale = useDeviceSettingsStore((state) => state.locale);

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const isLowPerformance = useIsLowPerformance();

	useRefreshOnFocus(refetch);

	const { pullToRefresh, scrollProps } = usePullToRefresh<Animated.FlatList<ReportSession>>({
		onRefresh: () => {
			setPullToRefreshUsed(true);

			return refetch();
		},
		holdHeight: BUDDY_REFRESH_HEIGHT,
		minRefreshMs: BUDDY_REFRESH_MIN_MS,
		finishMs: BUDDY_REFRESH_FINISH_MS,
	});

	const selectedPeriodShown = shownStart === selectedStart;
	const periodsAgo = periodsBetween(period, selectedStart, latestStart(period));

	const header = <ReportHeader start={shownStart} />;

	/** 기간별 report_viewed 이벤트 전송 */
	useEffect(() => {
		if (!screenFocused) {
			trackedPeriodRef.current = null;

			return;
		}

		const shownPeriodKey = `${period}:${selectedStart}`;

		if (!selectedPeriodShown || trackedPeriodRef.current === shownPeriodKey) {
			return;
		}

		trackedPeriodRef.current = shownPeriodKey;

		track('report_viewed', { period, periods_ago: periodsAgo, session_count: reportData.sessions.length });
	}, [period, selectedStart, screenFocused, selectedPeriodShown, periodsAgo, reportData]);

	/** 학습 항목 렌더링 함수 */
	const renderSessionItem = ({ item: session, index }: ListRenderItemInfo<ReportSession>) => {
		const dayStarted =
			period !== 'day' &&
			(index === 0 ||
				!dayjs(session.period.started_at).isSame(reportData.sessions[index - 1].period.started_at, 'day'));

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
	};

	return (
		<PullToRefreshContainer
			pullToRefresh={pullToRefresh}
			indicatorComponents={
				isLowPerformance
					? [BuddyRefreshThrobberIndicator]
					: [BuddyRefreshSwingIndicator, BuddyRefreshRopeIndicator]
			}
		>
			<Animated.FlatList
				{...scrollProps}
				data={reportData.sessions}
				keyExtractor={(session) => session.id}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={header}
				ListEmptyComponent=<EmptyState message={t('report.empty')} />
				renderItem={renderSessionItem}
			/>
		</PullToRefreshContainer>
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
