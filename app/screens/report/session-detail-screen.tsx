import { useCallback, useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { useGetSessionQuery } from '@/hooks/apis/sessions';
import useIsLowPerformance from '@/hooks/use-is-low-performance';
import usePullToRefresh from '@/hooks/use-pull-to-refresh';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import { useTranslation } from 'react-i18next';

import { formatMonthDayTime } from '@/i18n/format';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeftIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import SessionDetailContent, { CONTENT_PADDING_BOTTOM } from '@/screens/report/components/session-detail-content';
import SessionDetailSkeleton from '@/screens/report/components/session-detail-skeleton';
import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, contentMaxWidth, font } from '@/theme';

import {
	BUDDY_REFRESH_FINISH_MS,
	BUDDY_REFRESH_HEIGHT,
	BUDDY_REFRESH_MIN_MS,
} from '@/components/buddy-refresh/constants';
import BuddyRefreshHint from '@/components/buddy-refresh/hint';
import BuddyRefreshRopeIndicator from '@/components/buddy-refresh/rope-indicator';
import BuddyRefreshSwingIndicator from '@/components/buddy-refresh/swing-indicator';
import BuddyRefreshThrobberIndicator from '@/components/buddy-refresh/throbber-indicator';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import PullToRefreshContainer from '@/components/pull-to-refresh-container';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 세션 상세 화면 */
const SessionDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();
	const queryClient = useQueryClient();

	const { data: sessionData } = useGetSessionQuery({ id: params.sessionId });

	const locale = useDeviceSettingsStore((state) => state.locale);

	const setPullToRefreshUsed = useDeviceSettingsStore((state) => state.setPullToRefreshUsed);

	const lowPerformance = useIsLowPerformance();

	/** 세션 상세 새로고침 함수 */
	const refetchSessionDetail = useCallback(
		() => queryClient.invalidateQueries({ queryKey: sessionKeys.detail(params.sessionId) }),
		[queryClient, params.sessionId],
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

	/** session_detail_viewed 이벤트 전송 */
	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<BuddyRefreshHint mascotShown={!lowPerformance} />

			<PullToRefreshContainer
				style={styles.container}
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
					style={[styles.page, scrollProps.style]}
					contentContainerStyle={styles.content}
				>
					<View style={styles.header}>
						<IconButton
							icon={ChevronLeftIcon}
							label={t('common.back')}
							onPress={() => navigation.goBack()}
						/>

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
						<SessionDetailContent sessionId={params.sessionId} pullToRefresh={pullToRefresh} />
					</ErrorHandlingWrapper>
				</Animated.ScrollView>
			</PullToRefreshContainer>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	refreshIndicator: { right: 24, left: 24 },
	page: { flex: 1 },
	content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: CONTENT_PADDING_BOTTOM },
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
