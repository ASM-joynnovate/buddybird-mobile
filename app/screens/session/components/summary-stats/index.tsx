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
		metric: 'togetherTime',
		label: t('session.summary.totalTime'),
		amount: sessionEndedAt(period).diff(period.started_at),
		amountBeforeSession: null,
		unit: 'duration',
		revealSentenceIndex: 0,
	};
	const allTimeStat: SummaryStat = {
		metric: 'allTime',
		label: t('session.summary.allTotal'),
		amount: total.active.duration_ms,
		amountBeforeSession: Math.max(0, total.active.duration_ms - session.active.duration_ms),
		unit: 'duration',
		revealSentenceIndex: 2,
	};
	const stats: SummaryStat[] = [
		totalTimeStat,
		{
			metric: 'playCount',
			label: t('session.summary.playCount'),
			amount: session.play_count,
			amountBeforeSession: null,
			unit: 'count',
			revealSentenceIndex: 1,
		},
		allTimeStat,
		{
			metric: 'wordTime',
			label: t('session.summary.wordTotal', { word: word.name }),
			amount: word.active.duration_ms,
			amountBeforeSession: Math.max(0, word.active.duration_ms - session.active.duration_ms),
			unit: 'duration',
			revealSentenceIndex: 3,
		},
	];

	return (
		<View style={styles.container}>
			{stats.map((stat) => (
				<SummaryStatsItem
					key={stat.metric}
					stat={stat}
					revealed={summaryFilledSentenceIndexes.includes(stat.revealSentenceIndex)}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

export default SummaryStats;
