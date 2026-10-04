import { StyleSheet, View } from 'react-native';

import { useGetSession, useGetSessionSummary } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import SummaryStatsItem, { type SummaryStat } from '@/screens/session/components/summary-stats/item';
import { useSessionStore } from '@/stores/session';
import { sessionEndedAt } from '@/utils/date';

interface Props {
	sessionId: string;
}

/**
 * 학습 결과 칩 목록 컴포넌트
 * @param sessionId 세션 ID
 */
const SummaryStats = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const { data: sessionSummaryData } = useGetSessionSummary({ id: sessionId });
	const { data: sessionData } = useGetSession({ id: sessionId });

	const summaryFilledSentenceIndexes = useSessionStore((state) => state.summaryFilledSentenceIndexes);

	const { word, session, total } = sessionSummaryData;
	const { period } = sessionData;
	const totalTimeStat: SummaryStat = {
		metric: 'together',
		label: t('session.summary.totalTime'),
		value: sessionEndedAt(period).diff(period.started_at),
		valueBeforeSession: null,
		unit: 'duration',
		revealAt: 0,
	};
	const allTimeStat: SummaryStat = {
		metric: 'allTime',
		label: t('session.summary.allTotal'),
		value: total.learning.duration_ms,
		valueBeforeSession: Math.max(0, total.learning.duration_ms - session.learning.duration_ms),
		unit: 'duration',
		revealAt: 2,
	};
	const stats: SummaryStat[] = [
		totalTimeStat,
		{
			metric: 'played',
			label: t('session.summary.playCount'),
			value: session.play_count,
			valueBeforeSession: null,
			unit: 'count',
			revealAt: 1,
		},
		allTimeStat,
		{
			metric: 'wordTime',
			label: t('session.summary.wordTotal', { word: word.name }),
			value: word.learning.duration_ms,
			valueBeforeSession: Math.max(0, word.learning.duration_ms - session.learning.duration_ms),
			unit: 'duration',
			revealAt: 3,
		},
	];

	return (
		<View style={styles.container}>
			{stats.map((stat) => (
				<SummaryStatsItem
					key={stat.metric}
					stat={stat}
					revealed={summaryFilledSentenceIndexes.includes(stat.revealAt)}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

export default SummaryStats;
