import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

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

export function SessionSummaryScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();

	const resetPeriod = useReportStore((state) => state.resetPeriod);

	function openDetail() {
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
	}

	return (
		<Screen contentContainerStyle={styles.content}>
			{/*학습 요약*/}
			<View style={styles.body}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton rows={3} height={56} />
				>
					<SummaryCard sessionId={params.sessionId} />
				</ErrorHandlingWrapper>
			</View>

			{/*세션 상세 버튼*/}
			<Button label={t('session.summary.detail')} icon={ChartNoAxesColumnIcon} onPress={openDetail} />
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: { gap: 20 },
	body: { flex: 1, justifyContent: 'center' },
});
