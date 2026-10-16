import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Session, SessionSummary } from '@/types/apis/sessions';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { sessionDetailColors } from '@/screens/report/components/session-detail-colors';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

interface StatProps {
	emoji: string;
	value: string;
	label: string;
}

/**
 * 요약 칸 컴포넌트
 * @param emoji 이모지
 * @param value 값
 * @param label 이름
 */
const Stat = ({ emoji, value, label }: StatProps) => {
	return (
		<View accessible accessibilityLabel={joinLabel(label, value)} style={styles.stat}>
			<Copy style={styles.emoji}>{emoji}</Copy>
			<View style={styles.statText}>
				<Copy numberOfLines={1} style={styles.value}>
					{value}
				</Copy>
				<Copy numberOfLines={1} style={styles.label}>
					{label}
				</Copy>
			</View>
		</View>
	);
};

interface Props {
	session: Session;
	sessionSummary: SessionSummary;
	emergencyCount: number;
}

/**
 * 이번 학습 요약 컴포넌트
 * @param session 세션
 * @param sessionSummary 세션 요약
 * @param emergencyCount 응급 상황 수
 */
const SessionOverview = memo(({ session, sessionSummary, emergencyCount }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View style={styles.stats}>
			<Stat
				emoji="⏱️"
				value={formatDuration(sessionSummary.session.active.duration_ms, locale)}
				label={t('report.detail.learningTime')}
			/>
			<Stat emoji="💬" value={sessionSummary.word.name} label={t('report.detail.taughtWord')} />
			<Stat
				emoji="🦜"
				value={t('report.detail.mimicCountValue', { count: session.sounds.mimic_count })}
				label={t('report.detail.mimicCount')}
			/>
			<Stat
				emoji="🚨"
				value={t('report.detail.emergencyCountValue', { count: emergencyCount })}
				label={t('report.detail.emergencyCount')}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
	stat: {
		flexBasis: '40%',
		flexGrow: 1,
		minWidth: 0,
		minHeight: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		backgroundColor: sessionDetailColors.face,
	},
	emoji: { fontSize: 20, lineHeight: 24 },
	statText: { flex: 1, minWidth: 0 },
	value: { fontFamily: font.extraBold, fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
	label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
});

export default SessionOverview;
