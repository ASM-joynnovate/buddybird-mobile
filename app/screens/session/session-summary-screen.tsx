import { useEffect } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getSessionOptions, getSessionSummaryOptions } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon, HouseIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Confetti from '@/screens/session/components/confetti';
import SummarySpeech from '@/screens/session/components/summary-speech';
import SummaryStats from '@/screens/session/components/summary-stats';
import SummaryTitle from '@/screens/session/components/summary-title';
import { useReportStore } from '@/stores/report';
import { useSessionStore } from '@/stores/session';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';
import { ui } from '@/components/ui/styles';

/** 학습 완료 화면 */
const SessionSummaryScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();

	const { width, height } = useWindowDimensions();

	const insets = useSafeAreaInsets();

	usePrefetchQuery(getSessionSummaryOptions({ id: params.sessionId }));
	usePrefetchQuery(getSessionOptions({ id: params.sessionId }));
	usePrefetchQuery(getParrotListOptions());

	const resetPeriod = useReportStore((state) => state.resetPeriod);
	const resetSessionSummary = useSessionStore((state) => state.resetSessionSummary);
	const clearSummaryNumberOrigin = useSessionStore((state) => state.clearSummaryNumberOrigin);

	const isLandscape = width > height;

	/** 화면을 떠나면 완료 화면 값 초기화 */
	useEffect(() => {
		return () => resetSessionSummary();
	}, [resetSessionSummary]);

	/** 화면을 돌리면 날아가던 숫자의 위치 삭제 */
	useEffect(() => {
		clearSummaryNumberOrigin();
	}, [clearSummaryNumberOrigin, isLandscape]);

	const handleOpenDetail = () => {
		resetPeriod();

		navigation.reset({
			index: 0,
			routes: [
				{
					name: 'Main',
					params: {
						screen: 'ReportTab',
						params: {
							screen: 'SessionDetail',
							params: { sessionId: params.sessionId, source: 'summary' },
							initial: false,
						},
					},
				},
			],
		});
	};

	const actions = (
		<View style={ui.actionsRow}>
			<Button
				label={t('session.summary.viewDetail')}
				variant="secondary"
				size="small"
				icon={ChartNoAxesColumnIcon}
				onPress={handleOpenDetail}
				style={ui.action}
			/>
			<Button
				label={t('session.summary.goHome')}
				size="small"
				icon={HouseIcon}
				onPress={() => navigation.popTo('Main', { screen: 'HomeTab' })}
				style={ui.action}
			/>
		</View>
	);

	return (
		<View style={styles.screen}>
			{isLandscape ? (
				<Screen scrollable={false}>
					<View style={[styles.landscapeContainer, { paddingBottom: insets.bottom + 20 }]}>
						<View style={styles.sideColumn}>
							<ErrorHandlingWrapper
								fallbackComponent={ScreenError}
								suspenseFallback=<Skeleton blockCount={2} height={120} />
							>
								<SummarySpeech sessionId={params.sessionId} mascotSize={96} />
							</ErrorHandlingWrapper>
						</View>

						<View style={styles.mainColumn}>
							<View style={styles.mainContent}>
								<ErrorHandlingWrapper
									fallbackComponent={ScreenError}
									suspenseFallback=<Skeleton blockCount={3} height={56} />
								>
									<SummaryTitle sessionId={params.sessionId} />
									<SummaryStats sessionId={params.sessionId} />
								</ErrorHandlingWrapper>
							</View>

							{actions}
						</View>
					</View>
				</Screen>
			) : (
				<Screen footer={actions} contentContainerStyle={styles.portraitContent}>
					<ErrorHandlingWrapper
						fallbackComponent={ScreenError}
						suspenseFallback=<Skeleton blockCount={3} height={56} />
					>
						<View style={styles.titleSpeechContainer}>
							<SummaryTitle sessionId={params.sessionId} />
							<SummarySpeech sessionId={params.sessionId} mascotSize={140} />
						</View>

						<SummaryStats sessionId={params.sessionId} />
					</ErrorHandlingWrapper>
				</Screen>
			)}

			<Confetti />
		</View>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1 },
	portraitContent: { gap: 16 },
	titleSpeechContainer: { flexGrow: 1, justifyContent: 'center', gap: 40, paddingTop: 16 },
	landscapeContainer: { flex: 1, flexDirection: 'row', gap: 32, paddingTop: 20, paddingHorizontal: 24 },
	sideColumn: { width: 280, justifyContent: 'center' },
	mainColumn: { flex: 1, gap: 16 },
	mainContent: { flex: 1, justifyContent: 'flex-end', gap: 12 },
});

export default SessionSummaryScreen;
