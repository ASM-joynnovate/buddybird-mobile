import { StyleSheet, View } from 'react-native';

import type { Session, SessionSummary } from '@/types/apis/sessions';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDayTime } from '@/i18n/format';

import { ChevronRightIcon } from 'lucide-react-native';

import { HOUR, MINUTE, MINUTES_PER_HOUR } from '@/config/units';
import DashedLine from '@/screens/report/components/dashed-line';
import SessionOverviewOdometer from '@/screens/report/components/session-overview/odometer';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { Surface } from '@/components/ui/surface';
import { Title } from '@/components/ui/title';

interface FlowStepProps {
	label: string;
	count: number;
	kind?: 'parrot' | 'mimic';
}

/**
 * 소리 흐름의 한 칸 컴포넌트
 * @param label 칸 이름
 * @param count 소리 개수
 * @param kind 숫자에 색을 칠할 소리 종류
 */
const FlowStep = ({ label, count, kind }: FlowStepProps) => {
	const stepEmpty = count === 0;
	const stepFilled = !stepEmpty && kind === 'mimic';

	return (
		<Surface
			accessible
			accessibilityLabel={joinLabel(label, String(count))}
			depth={stepEmpty ? 'none' : 'low'}
			cornerRadius="tile"
			faceColor={stepFilled ? colors.purple : undefined}
			edgeColor={stepFilled ? colors.purpleDark : undefined}
			style={styles.step}
			contentStyle={[styles.stepFace, stepFilled && styles.filledStepFace, stepEmpty && styles.emptyStepFace]}
		>
			<Copy numberOfLines={1} style={[styles.stepLabel, stepFilled && styles.filledText]}>
				{label}
			</Copy>
			<Copy
				style={[
					styles.stepCount,
					!stepEmpty && kind === 'parrot' && styles.parrotCount,
					stepFilled && styles.filledText,
					stepEmpty && styles.emptyCount,
				]}
			>
				{count}
			</Copy>
		</Surface>
	);
};

interface Props {
	session: Session;
	sessionSummary: SessionSummary;
}

/**
 * 이번 학습 결과 패널 컴포넌트
 * @param session 세션
 * @param sessionSummary 세션 요약
 */
const SessionOverview = ({ session, sessionSummary }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const period = session.period;
	const learningMs = sessionSummary.session.active.duration_ms;
	const learningClock = [Math.floor(learningMs / HOUR), Math.floor(learningMs / MINUTE) % MINUTES_PER_HOUR]
		.map((value) => String(value).padStart(2, '0'))
		.join(':');
	const playCount = sessionSummary.session.play_count;

	return (
		<View style={styles.panel}>
			<Title>{sessionSummary.word.name}</Title>
			<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.period}>
				{t('report.detail.period', {
					start: formatMonthDayTime(period.started_at, locale),
					end: period.ended_at ? formatMonthDayTime(period.ended_at, locale) : t('report.detail.now'),
				})}
			</Copy>

			<View style={styles.divider}>
				<DashedLine color={colors.border} />
			</View>

			<View style={styles.counters}>
				<View
					accessible
					accessibilityLabel={joinLabel(t('report.detail.learningTime'), formatDuration(learningMs, locale))}
					style={styles.counter}
				>
					<Copy style={styles.counterLabel}>{t('report.detail.learningTime')}</Copy>
					<SessionOverviewOdometer value={learningClock} />
				</View>

				<View
					accessible
					accessibilityLabel={joinLabel(t('report.detail.playCount'), String(playCount))}
					style={styles.counter}
				>
					<Copy style={styles.counterLabel}>{t('report.detail.playCount')}</Copy>
					<SessionOverviewOdometer value={String(playCount)} />
				</View>
			</View>

			<View style={styles.divider}>
				<DashedLine color={colors.border} />
			</View>

			{/*오디오에서 따라 한 소리까지 줄어드는 흐름*/}
			<View style={styles.flow}>
				<FlowStep label={t('report.detail.detected')} count={session.sounds.vad_count} />
				<View style={styles.arrow}>
					<ChevronRightIcon size={16} color={colors.subtle} />
				</View>
				<FlowStep label={t('report.detail.kinds.parrot')} count={session.sounds.parrot_count} kind="parrot" />
				<View style={styles.arrow}>
					<ChevronRightIcon size={16} color={colors.subtle} />
				</View>
				<FlowStep label={t('report.detail.kinds.mimic')} count={session.sounds.mimic_count} kind="mimic" />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	panel: {
		padding: 16,
		borderRadius: 18,
		borderWidth: 2,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
	period: {
		marginTop: 2,
		fontFamily: font.extraBold,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	counters: { gap: 10, marginTop: 16 },
	counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
	counterLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	divider: { marginTop: 16 },
	flow: { flexDirection: 'row', alignItems: 'stretch', gap: 6, marginTop: 16 },
	arrow: { alignSelf: 'center' },
	step: { flex: 1, minWidth: 0 },
	stepFace: { flexGrow: 1, alignItems: 'center', gap: 2, paddingTop: 8, paddingHorizontal: 8, paddingBottom: 6 },
	filledStepFace: { borderColor: colors.purple },
	emptyStepFace: { borderStyle: 'dashed', borderColor: colors.subtle },
	stepLabel: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	stepCount: { fontFamily: font.black, fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
	parrotCount: { color: colors.blueDark },
	filledText: { color: colors.onFilled },
	emptyCount: { color: colors.subtle },
});

export default SessionOverview;
