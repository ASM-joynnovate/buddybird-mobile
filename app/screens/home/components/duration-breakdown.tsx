import { StyleSheet, View } from 'react-native';

import type { LearningDuration } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDurationWithDays } from '@/i18n/format';

import { InfinityIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { phaseDurations } from '@/utils/phases';

import { Copy } from '@/components/ui/copy';
import { Card } from '@/components/ui/surface/card';

const BREAKDOWN_PHASES = [
	{ phase: 'learning', color: colors.orange },
	{ phase: 'rest', color: colors.blue },
	{ phase: 'stress_care', color: colors.blue },
] as const;

interface Props {
	duration: LearningDuration;
}

/**
 * 학습 시간 합계 컴포넌트
 * @param duration 선택한 학습 시간
 */
const DurationBreakdown = ({ duration }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const totals = duration.ms === null ? null : phaseDurations(duration.ms);

	return (
		<Card depth="none" style={styles.cardContainer} contentStyle={styles.card}>
			{/*총 학습 시간*/}
			<View style={styles.totalRow}>
				<Copy style={styles.totalLabel}>{t('session.start.total')}</Copy>
				<Copy style={styles.total}>
					{duration.ms === null ? t('session.start.untilEnd') : formatDurationWithDays(duration.ms, locale)}
				</Copy>
			</View>

			{/*단계별 학습 시간*/}
			<View style={styles.phasesRow}>
				{BREAKDOWN_PHASES.map(({ phase, color }, index) => (
					<View key={phase} style={[styles.phaseContainer, index > 0 && styles.phaseContainerDivided]}>
						<View style={styles.phaseLabelRow}>
							<View style={[styles.dot, { backgroundColor: color }]} />
							<Copy style={styles.phaseLabel}>{t(`common.phases.${phase}`)}</Copy>
						</View>
						{totals ? (
							<Copy style={[styles.phaseTime, { color }]}>
								{formatDurationWithDays(totals[phase], locale)}
							</Copy>
						) : (
							<InfinityIcon size={22} color={color} style={styles.infinity} />
						)}
					</View>
				))}
			</View>
		</Card>
	);
};

const styles = StyleSheet.create({
	cardContainer: { marginTop: 4 },
	card: { padding: 0, overflow: 'hidden' },
	totalRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		padding: 16,
		backgroundColor: colors.surface,
	},
	totalLabel: { flex: 1, fontSize: 13, color: colors.muted },
	total: { flexShrink: 1, fontFamily: font.black, fontSize: 17 },
	phasesRow: { flexDirection: 'row', borderTopWidth: 2, borderColor: colors.border },
	phaseContainer: { flex: 1, minWidth: 0, padding: 14 },
	phaseContainerDivided: { borderLeftWidth: 2, borderColor: colors.border },
	phaseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	dot: { width: 9, height: 9, borderRadius: radius.pill },
	phaseLabel: { flexShrink: 1, fontSize: 13, color: colors.muted },
	phaseTime: { marginTop: 4, fontFamily: font.black, fontSize: 18 },
	infinity: { marginTop: 4 },
});

export default DurationBreakdown;
