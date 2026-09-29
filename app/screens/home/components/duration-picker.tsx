import { StyleSheet, View } from 'react-native';

import type { LearningDuration } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatDurationWithDays } from '@/i18n/format';

import { CheckIcon } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CUSTOM_SESSION_DEFAULT_MS, MAX_SESSION_MS, SESSION_DURATION_PRESETS } from '@/config';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, layoutAnimationMs, radius } from '@/theme';
import { DAY, HOUR, MINUTE } from '@/utils/units';

import { Copy } from '@/components/ui/copy';
import { Card } from '@/components/ui/surface/card';
import { ChoiceCard } from '@/components/ui/surface/choice-card';
import { HOURS, MINUTE_STEPS, WheelPicker } from '@/components/ui/wheel-picker';

const DAYS = Array.from({ length: 8 }, (_, day) => day);

interface DurationChoice {
	key: string;
	title: string;
	durationText: string | null;
	hint: string;
	selected: boolean;
	nextDuration: LearningDuration;
}

interface Props {
	value: LearningDuration;
	onChange: (value: LearningDuration) => void;
}

/**
 * 학습 시간 선택 컴포넌트
 * @param value 고른 학습 시간
 * @param onChange 학습 시간을 고를 때 실행할 함수
 */
const DurationPicker = ({ value, onChange }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const totalMs = value.ms ?? 0;
	const days = Math.floor(totalMs / DAY);
	const hours = Math.floor((totalMs % DAY) / HOUR);
	const minutes = Math.floor((totalMs % HOUR) / MINUTE);
	const atMax = totalMs >= MAX_SESSION_MS;
	const choices: DurationChoice[] = [
		{
			key: 'untilEnd',
			title: t('session.start.untilEnd'),
			durationText: null,
			hint: t('session.start.untilEndHint'),
			selected: !value.custom && value.ms === null,
			nextDuration: { ms: null, custom: false },
		},
		...SESSION_DURATION_PRESETS.map((preset) => ({
			key: preset.id,
			title: formatDuration(preset.ms, locale),
			durationText: null,
			hint: t(`session.start.presetHints.${preset.id}`),
			selected: !value.custom && value.ms === preset.ms,
			nextDuration: { ms: preset.ms, custom: false },
		})),
		{
			key: 'custom',
			title: t('session.start.custom'),
			durationText: value.custom && totalMs > 0 ? formatDurationWithDays(totalMs, locale) : null,
			hint: t('session.start.customHint'),
			selected: value.custom,
			nextDuration: { ms: CUSTOM_SESSION_DEFAULT_MS, custom: true },
		},
	];

	/** 직접 설정 학습 시간 넘기기 */
	const change = (nextDays: number, nextHours: number, nextMinutes: number) => {
		onChange({
			ms: Math.min(nextDays * DAY + nextHours * HOUR + nextMinutes * MINUTE, MAX_SESSION_MS),
			custom: true,
		});
	};

	/** 고른 학습 시간 넘기기 */
	const handleSelectChoice = (nextDuration: LearningDuration) => {
		if (nextDuration.custom && value.custom) {
			return;
		}

		onChange(nextDuration);
	};

	return (
		<>
			{/*학습 시간 카드*/}
			{choices.map((choice) => (
				<ChoiceCard
					key={choice.key}
					selected={choice.selected}
					onPress={() => handleSelectChoice(choice.nextDuration)}
					accessibilityLabel={choice.durationText ? `${choice.title}, ${choice.durationText}` : choice.title}
					style={styles.choiceCardContainer}
					contentStyle={styles.choiceCard}
				>
					<View style={[styles.radio, choice.selected && styles.radioSelected]}>
						{choice.selected && <CheckIcon size={15} color={colors.onFilled} />}
					</View>
					<View style={styles.choiceTextContainer}>
						<View style={styles.titleRow}>
							<Copy style={styles.title}>{choice.title}</Copy>
							{!!choice.durationText && <Copy style={styles.durationText}>{choice.durationText}</Copy>}
						</View>
						<Copy style={styles.hint}>{choice.hint}</Copy>
					</View>
				</ChoiceCard>
			))}

			{/*직접 설정 휠*/}
			{value.custom && (
				<Animated.View
					entering={FadeIn.duration(layoutAnimationMs)}
					exiting={FadeOut.duration(layoutAnimationMs)}
					style={styles.customCardContainer}
				>
					<Card depth="none" contentStyle={styles.customCard}>
						<Copy style={styles.customTitle}>{t('session.start.total')}</Copy>
						<WheelPicker
							columns={[
								{
									key: 'days',
									label: t('session.start.days'),
									value: days,
									values: DAYS,
									unit: t('session.start.days'),
									onChange: (nextDays) => change(nextDays, hours, minutes),
								},
								{
									key: 'hours',
									label: t('session.start.hours'),
									value: hours,
									values: atMax ? [0] : HOURS,
									unit: t('session.start.hours'),
									onChange: (nextHours) => change(days, nextHours, minutes),
								},
								{
									key: 'minutes',
									label: t('session.start.minutes'),
									value: minutes,
									values: atMax ? [0] : MINUTE_STEPS,
									unit: t('session.start.minutes'),
									onChange: (nextMinutes) => change(days, hours, nextMinutes),
								},
							]}
						/>
					</Card>
				</Animated.View>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	choiceCardContainer: { marginBottom: 8 },
	choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76 },
	radio: {
		width: 25,
		height: 25,
		borderRadius: radius.pill,
		borderWidth: 3,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
	choiceTextContainer: { flex: 1, minWidth: 0 },
	titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 },
	title: { flexGrow: 1, flexShrink: 1, fontFamily: font.black, fontSize: 16 },
	durationText: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 12.5, color: colors.orange },
	hint: { marginTop: 4, fontSize: 12, lineHeight: 17, color: colors.muted },
	customCardContainer: { marginBottom: 16 },
	customCard: { padding: 12, gap: 10 },
	customTitle: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});

export default DurationPicker;
