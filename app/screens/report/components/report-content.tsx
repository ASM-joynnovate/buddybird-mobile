import { useDeferredValue, useEffect, useRef } from 'react';

import { FlatList, StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { getReportOptions } from '@/hooks/apis/reports';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SCREEN_REFRESH_MS } from '@/config';
import ReportHeader from '@/screens/report/components/report-header';
import SessionItem from '@/screens/report/components/session-item';
import { track } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useReportStore } from '@/stores/report';
import { colors, font } from '@/theme';
import { periodsBetween } from '@/utils/date';
import { latestStart, periodSelectionFromParams } from '@/utils/report-period';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

/** 리포트 요약, 학습 목록, 앵무새가 따라 한 횟수나 로그인 안내를 보여 주고 아래로 당기면 다시 불러오는 목록 컴포넌트 */
const ReportContent = () => {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const focused = useIsFocused();

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
			focused && query.state.data?.sessions.some((session) => session.judgment_status === 'pending')
				? SCREEN_REFRESH_MS
				: false,
	});

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	const hasSessions = reportData.sessions.length > 0;
	const isSelectedPeriodShown = deferredPeriod === period && deferredStart === selectedStart;
	const periodsAgo = periodsBetween(period, selectedStart, latestStart(period));

	const header = <ReportHeader report={reportData} />;

	const mimicrySection = hasSessions ? (
		<View style={ui.section}>
			<View style={styles.mimicryTitleRow}>
				<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.grow]}>
					{t('report.mimicryTitle')}
				</Copy>
				{!isAnonymous && (
					<Copy style={styles.mimicryCount}>
						{t('report.mimicryCount', { count: reportData.mimicry.count })}
					</Copy>
				)}
			</View>

			{isAnonymous && (
				<View style={styles.signInRequiredContainer}>
					<Copy style={styles.signInRequiredText}>{t('report.signInRequired')}</Copy>
					<Button label={t('auth.signIn')} variant="secondary" onPress={() => navigation.navigate('Login')} />
				</View>
			)}
		</View>
	) : null;

	/** 화면에 보이는 리포트 기간마다 report_viewed 한 번 전송 */
	useEffect(() => {
		if (!focused) {
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
	}, [deferredPeriod, deferredStart, focused, isSelectedPeriodShown, periodsAgo, reportData, route.params]);

	return (
		<FlatList
			data={reportData.sessions}
			keyExtractor={(session) => session.id}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
			refreshing={isRefetching}
			onRefresh={() => void refetch()}
			ListHeaderComponent={header}
			ListFooterComponent={mimicrySection}
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
	signInRequiredText: { color: colors.muted },
	signInRequiredContainer: { gap: 12 },
	mimicryTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
	grow: { flex: 1 },
	mimicryCount: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
});

export default ReportContent;
