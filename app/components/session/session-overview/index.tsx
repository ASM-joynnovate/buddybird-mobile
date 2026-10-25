import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import SessionOverviewStat from '@/components/session/session-overview/stat';

import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import AlertIcon from '@assets/images/icons/report/stats/alert.svg';
import ClockIcon from '@assets/images/icons/report/stats/clock.svg';
import SpeechBubbleIcon from '@assets/images/icons/report/stats/speech-bubble.svg';

interface Props {
	learningMs: number;
	wordName: string;
	mimicCount: number;
	emergencyCount: number;
}

/**
 * 이번 학습 요약 컴포넌트
 * @param learningMs 학습 시간
 * @param wordName 가르친 단어
 * @param mimicCount 따라 한 횟수
 * @param emergencyCount 응급 상황 수
 */
const SessionOverview = ({ learningMs, wordName, mimicCount, emergencyCount }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View style={styles.stats}>
			<SessionOverviewStat
				icon={ClockIcon}
				value={formatDuration(learningMs, locale)}
				label={t('report.detail.learningTime')}
			/>
			<SessionOverviewStat icon={SpeechBubbleIcon} value={wordName} label={t('report.detail.taughtWord')} />
			<SessionOverviewStat
				icon={MimicIcon}
				value={t('report.detail.mimicCountValue', { count: mimicCount })}
				label={t('report.detail.mimicCount')}
			/>
			<SessionOverviewStat
				icon={AlertIcon}
				value={t('report.detail.emergencyCountValue', { count: emergencyCount })}
				label={t('report.detail.emergencyCount')}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});

export default SessionOverview;
