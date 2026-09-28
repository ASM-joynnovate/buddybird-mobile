import { useDeferredValue, useEffect, useRef } from 'react';

import { FlatList, StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { getReportOptions } from '@/hooks/apis/reports';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SCREEN_REFRESH_MS } from '@/config';
import { ReportHeader } from '@/screens/report/components/report-header';
import { SessionItem } from '@/screens/report/components/session-item';
import type { ReportPeriodState } from '@/screens/report/hooks/use-report-period';
import { track } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { colors, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

interface Props {
	reportPeriod: ReportPeriodState;
}

/**
 * 리포트 본문 컴포넌트
 * @param reportPeriod 고른 리포트 기간과 기간 변경 함수
 */
const ReportContent = ({ reportPeriod }: Props) => {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const focused = useIsFocused();

	const deferredPeriod = useDeferredValue(reportPeriod.period);
	const deferredStart = useDeferredValue(reportPeriod.start);

	const trackedPeriodRef = useRef<string | null>(null);
	const trackedNotificationParamsRef = useRef<object | null>(null);

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
	const isSelectedPeriodShown = deferredPeriod === reportPeriod.period && deferredStart === reportPeriod.start;

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

		trackedPeriodRef.current = shownPeriodKey;
		trackedNotificationParamsRef.current = route.params ?? null;

		track('report_viewed', {
			period: deferredPeriod,
			periods_ago: reportPeriod.periodsAgo,
			source: openedFromNotification ? 'notification' : 'tab',
			session_count: reportData.sessions.length,
		});
	}, [
		deferredPeriod,
		deferredStart,
		focused,
		isSelectedPeriodShown,
		reportData,
		reportPeriod.periodsAgo,
		route.params,
	]);

	/** 세션 상세 화면 열기 */
	const handleOpenSession = (sessionId: string) => {
		navigation.navigate('Main', {
			screen: 'ReportTab',
			params: { screen: 'SessionDetail', params: { sessionId, source: 'report' } },
		});
	};

	const header = (
		<ReportHeader
			state={reportPeriod}
			report={reportData}
			onStart={() => navigation.navigate('Main', { screen: 'HomeTab' })}
		/>
	);

	const mimicrySection = hasSessions ? (
		<View style={ui.section}>
			<View style={styles.mimicryTitleRow}>
				<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.grow]}>
					{t('report.sounds')}
				</Copy>
				{!isAnonymous && (
					<Copy style={styles.mimicryCount}>{t('report.mimicry', { count: reportData.mimicry.count })}</Copy>
				)}
			</View>

			{isAnonymous && (
				<View style={styles.signInRequiredContainer}>
					<Copy style={styles.signInRequiredText}>{t('auth.signInRequired')}</Copy>
					<Button label={t('auth.signIn')} variant="secondary" onPress={() => navigation.navigate('Login')} />
				</View>
			)}
		</View>
	) : null;

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
			renderItem={({ item: session }) => (
				<SessionItem
					session={session}
					judging={!isAnonymous && session.judgment_status === 'pending'}
					onPress={() => handleOpenSession(session.id)}
				/>
			)}
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
