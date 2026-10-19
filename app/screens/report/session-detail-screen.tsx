import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { getSessionOptions } from '@/hooks/apis/sessions';
import useIsLowPerformance from '@/hooks/use-is-low-performance';

import { useTranslation } from 'react-i18next';

import { formatMonthDayTime } from '@/i18n/format';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeftIcon } from 'lucide-react-native';

import SessionDetailContent from '@/screens/report/components/session-detail-content';
import SessionDetailSkeleton from '@/screens/report/components/session-detail-skeleton';
import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth, font } from '@/theme';

import BuddyRefreshHint from '@/components/buddy-refresh/hint';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
/** 세션 상세 화면 */
const SessionDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();

	const { data: sessionData } = useQuery(getSessionOptions({ id: params.sessionId }));

	const locale = useDeviceSettingsStore((state) => state.locale);

	const lowPerformance = useIsLowPerformance();

	/** 세션 변경 시 session_detail_viewed 이벤트 전송 */
	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<BuddyRefreshHint mascotShown={!lowPerformance} />

			<View style={styles.container}>
				<View style={styles.header}>
					<IconButton icon={ChevronLeftIcon} label={t('common.back')} onPress={() => navigation.goBack()} />

					<View style={styles.headText}>
						<Copy accessibilityRole="header" style={styles.title}>
							{t('report.detail.title')}
						</Copy>
						{sessionData && (
							<Copy numberOfLines={1} style={styles.period}>
								{t('report.detail.period', {
									start: formatMonthDayTime(sessionData.period.started_at, locale),
									end: sessionData.period.ended_at
										? formatMonthDayTime(sessionData.period.ended_at, locale)
										: t('report.detail.now'),
								})}
							</Copy>
						)}
					</View>
				</View>

				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<SessionDetailSkeleton />>
					<SessionDetailContent sessionId={params.sessionId} />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
	},
	header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -12, paddingBottom: 4 },
	headText: { flex: 1, minWidth: 0 },
	title: { fontFamily: font.bold, fontSize: 20, lineHeight: 26 },
	period: {
		fontFamily: font.medium,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
});

export default SessionDetailScreen;
