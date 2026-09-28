import { StyleSheet, View } from 'react-native';

import type { LearningDuration } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { DURATION_PRESETS, MAX_SESSION_MS } from '@/config';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { DAY, HOUR, MINUTE } from '@/utils/units';

import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListRadioItem } from '@/components/ui/grouped-list/radio-item';
import { HOURS, MINUTE_STEPS, WheelPicker } from '@/components/ui/wheel-picker';

const DAYS = Array.from({ length: MAX_SESSION_MS / DAY + 1 }, (_, day) => day);

interface Props {
	value: LearningDuration;
	onChange(value: LearningDuration): void;
}

export function DurationPicker({ value, onChange }: Props) {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const total = value.ms ?? 0;
	const days = Math.floor(total / DAY);
	const hours = Math.floor((total % DAY) / HOUR);
	const minutes = Math.floor((total % HOUR) / MINUTE);
	const atMax = total >= MAX_SESSION_MS;

	function change(nextDays: number, nextHours: number, nextMinutes: number) {
		const next = Math.min(nextDays * DAY + nextHours * HOUR + nextMinutes * MINUTE, MAX_SESSION_MS);

		onChange({ ms: next > 0 ? next : null, custom: true });
	}

	return (
		<View style={styles.picker}>
			<GroupedList>
				<GroupedListRadioItem
					first
					label={t('session.start.untilEnd')}
					selected={!value.custom && value.ms === null}
					onPress={() => onChange({ ms: null, custom: false })}
				/>
				{DURATION_PRESETS.map((preset) => (
					<GroupedListRadioItem
						key={preset}
						label={formatDuration(preset, locale)}
						selected={!value.custom && value.ms === preset}
						onPress={() => onChange({ ms: preset, custom: false })}
					/>
				))}
				<GroupedListRadioItem
					label={t('session.start.custom')}
					selected={value.custom}
					onPress={() => onChange({ ms: value.ms, custom: true })}
				/>
			</GroupedList>
			{value.custom ? (
				<WheelPicker
					columns={[
						{
							key: 'days',
							label: t('session.start.days'),
							value: days,
							values: DAYS,
							unit: t('session.start.days'),
							onChange: (next) => change(next, hours, minutes),
						},
						{
							key: 'hours',
							label: t('session.start.hours'),
							value: hours,
							values: atMax ? [0] : HOURS,
							unit: t('session.start.hours'),
							onChange: (next) => change(days, next, minutes),
						},
						{
							key: 'minutes',
							label: t('session.start.minutes'),
							value: minutes,
							values: atMax ? [0] : MINUTE_STEPS,
							unit: t('session.start.minutes'),
							onChange: (next) => change(days, hours, next),
						},
					]}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	picker: { gap: 12 },
});
