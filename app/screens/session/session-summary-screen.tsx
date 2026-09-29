import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getSessionOptions } from '@/hooks/apis/sessions';
import { getWordListOptions } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon } from 'lucide-react-native';

import SummaryCard from '@/screens/session/components/summary-card';
import { useReportStore } from '@/stores/report';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

/** 학습한 단어와 전체 학습 시간, 기록 보기 버튼을 보여 주고 버튼을 누르면 리포트 탭의 세션 상세 화면을 여는 화면 */
const SessionSummaryScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();

	usePrefetchQuery(getSessionOptions({ id: params.sessionId }));
	usePrefetchQuery(getWordListOptions());

	const resetPeriod = useReportStore((state) => state.resetPeriod);

	/** 리포트 기간 초기화와 리포트 탭의 세션 상세 화면 이동 */
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

	return (
		<Screen contentContainerStyle={styles.content}>
			{/*학습한 단어와 전체 학습 시간*/}
			<View style={styles.summaryContainer}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton blockCount={3} height={56} />
				>
					<SummaryCard sessionId={params.sessionId} />
				</ErrorHandlingWrapper>
			</View>

			{/*세션 상세 버튼*/}
			<Button label={t('session.summary.viewDetail')} icon={ChartNoAxesColumnIcon} onPress={handleOpenDetail} />
		</Screen>
	);
};

const styles = StyleSheet.create({
	content: { gap: 20 },
	summaryContainer: { flex: 1, justifyContent: 'center' },
});

export default SessionSummaryScreen;
