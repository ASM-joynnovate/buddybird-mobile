import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getSessionOptions } from '@/hooks/apis/sessions';
import { getWordListOptions } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChartNoAxesColumnIcon } from 'lucide-react-native';

import { Stat } from '@/screens/session/components/stat';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/surface';

export function SessionSummaryScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<RootStackParamList, 'SessionSummary'>>();

	const { data: sessionData, isError, refetch } = useQuery(getSessionOptions({ id: params.sessionId }));
	const { data: wordListData } = useQuery(getWordListOptions());

	const locale = useDeviceSettingsStore((state) => state.locale);

	function openDetail() {
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

	let body = <Skeleton rows={3} height={56} />;

	if (isError) {
		body = <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
	} else if (sessionData) {
		const { period, word_id: wordId } = sessionData;
		const total = period.ended_at ? Date.parse(period.ended_at) - Date.parse(period.started_at) : 0;
		const word = wordListData?.find((item) => item.id === wordId);

		body = (
			<Card contentStyle={styles.card}>
				<Stat size="large" label={t('session.summary.word')} value={word?.name ?? ''} />
				<Stat size="large" label={t('session.summary.total')} value={formatDuration(total, locale)} />
			</Card>
		);
	}

	return (
		<Screen contentContainerStyle={styles.content}>
			{/*학습 요약*/}
			<View style={styles.body}>{body}</View>

			{/*세션 상세 버튼*/}
			<Button label={t('session.summary.detail')} icon={ChartNoAxesColumnIcon} onPress={openDetail} />
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: { gap: 20 },
	body: { flex: 1, justifyContent: 'center' },
	card: { padding: 20, gap: 16 },
});
