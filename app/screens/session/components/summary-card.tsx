import { StyleSheet } from 'react-native';

import { useGetSession } from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import dayjs from 'dayjs';

import { Stat } from '@/screens/session/components/stat';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Card } from '@/components/ui/surface';

interface Props {
	sessionId: string;
}

/**
 * 학습 요약 카드 컴포넌트
 * @param sessionId 세션 ID
 */
const SummaryCard = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const { data: sessionData } = useGetSession({ id: sessionId });
	const { data: wordListData } = useGetWordList();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const { period, word_id: wordId } = sessionData;
	const totalMs = period.ended_at ? dayjs(period.ended_at).diff(period.started_at) : 0;
	const word = wordListData.find(({ id }) => id === wordId);

	return (
		<Card contentStyle={styles.card}>
			<Stat size="large" label={t('session.summary.word')} value={word?.name ?? ''} />
			<Stat size="large" label={t('session.summary.total')} value={formatDuration(totalMs, locale)} />
		</Card>
	);
};

const styles = StyleSheet.create({
	card: { padding: 20, gap: 16 },
});

export default SummaryCard;
