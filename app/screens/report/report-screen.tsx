import { type ReactElement, useEffect, useRef } from 'react';

import { FlatList, StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { getReportOptions } from '@/hooks/apis/reports';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SCREEN_REFRESH_MS } from '@/config';
import { ReportHeader } from '@/screens/report/components/report-header';
import { SessionItem } from '@/screens/report/components/session-item';
import { useReportPeriod } from '@/screens/report/hooks/use-report-period';
import { track } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { colors, contentMaxWidth, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

export function ReportScreen(): ReactElement {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const focused = useIsFocused();

	const viewedPeriod = useRef<string | null>(null);
	const recordedNotificationParams = useRef<object | null>(null);

	const period = useReportPeriod(route.params);

	const {
		data: reportData,
		isError,
		isRefetching,
		refetch,
	} = useQuery({
		...getReportOptions({ period: period.period, start: period.start }),
		refetchInterval: (query) =>
			focused && query.state.data?.sessions.some((session) => session.judgment_status === 'pending')
				? SCREEN_REFRESH_MS
				: false,
	});

	const isAnonymous = useAccountStore((account) => account.isAnonymous);

	const recorded = reportData !== undefined && reportData.sessions.length > 0;

	useEffect(() => {
		if (!focused) {
			viewedPeriod.current = null;

			return;
		}

		const shownPeriod = `${period.period}:${period.start}`;
		const openedFromNotification =
			route.params?.source === 'notification' && recordedNotificationParams.current !== route.params;

		if (!reportData || (viewedPeriod.current === shownPeriod && !openedFromNotification)) {
			return;
		}

		viewedPeriod.current = shownPeriod;
		recordedNotificationParams.current = route.params ?? null;

		track('report_viewed', {
			period: period.period,
			periods_ago: period.periodsAgo,
			source: openedFromNotification ? 'notification' : 'tab',
			session_count: reportData.sessions.length,
		});
	}, [focused, period.period, period.periodsAgo, period.start, reportData, route.params]);

	function openSession(sessionId: string) {
		navigation.navigate('Main', {
			screen: 'ReportTab',
			params: { screen: 'SessionDetail', params: { sessionId, source: 'report' } },
		});
	}

	const header = (
		<ReportHeader
			state={period}
			report={reportData}
			loadFailed={isError}
			onRetry={() => void refetch()}
			onStart={() => navigation.navigate('Main', { screen: 'HomeTab' })}
		/>
	);

	const footer =
		reportData && recorded ? (
			<View style={ui.section}>
				<View style={styles.mimicryTitle}>
					<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.grow]}>
						{t('report.sounds')}
					</Copy>
					{isAnonymous ? null : (
						<Copy style={styles.mimicryCount}>
							{t('report.mimicry', { count: reportData.mimicry.count })}
						</Copy>
					)}
				</View>

				{isAnonymous ? (
					<View style={styles.locked}>
						<Copy style={styles.none}>{t('auth.signInRequired')}</Copy>
						<Button
							label={t('auth.signIn')}
							variant="secondary"
							onPress={() => navigation.navigate('Login')}
						/>
					</View>
				) : null}
			</View>
		) : null;

	return (
		<Screen scroll={false}>
			{/*리포트와 세션 목록*/}
			<FlatList
				data={recorded ? reportData?.sessions : []}
				keyExtractor={(session) => session.id}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshing={isRefetching}
				onRefresh={() => void refetch()}
				ListHeaderComponent={header}
				ListFooterComponent={footer}
				renderItem={({ item }) => (
					<SessionItem
						session={item}
						judging={!isAnonymous && item.judgment_status === 'pending'}
						onPress={() => openSession(item.id)}
					/>
				)}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: {
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 24,
		gap: 10,
	},
	none: { color: colors.muted },
	locked: { gap: 12 },
	mimicryTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
	grow: { flex: 1 },
	mimicryCount: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
});
