import { StyleSheet, View } from 'react-native';

import type { LearningDuration } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { MAX_SESSION_MS, SESSION_DURATION_PRESETS } from '@/config';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { DAY, HOUR, MINUTE } from '@/utils/units';

import { ItemGroup } from '@/components/ui/item/group';
import { ItemRadio } from '@/components/ui/item/radio';
import { HOURS, MINUTE_STEPS, WheelPicker } from '@/components/ui/wheel-picker';

const DAYS = Array.from({ length: MAX_SESSION_MS / DAY + 1 }, (_, day) => day);

interface Props {
	value: LearningDuration;
	onChange(value: LearningDuration): void;
}

export function DurationPicker({ value, onChange }: Props) {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const totalMs = value.ms ?? 0;
	const days = Math.floor(totalMs / DAY);
	const hours = Math.floor((totalMs % DAY) / HOUR);
	const minutes = Math.floor((totalMs % HOUR) / MINUTE);
	const atMax = totalMs >= MAX_SESSION_MS;

	function change(nextDays: number, nextHours: number, nextMinutes: number) {
		const nextMs = Math.min(nextDays * DAY + nextHours * HOUR + nextMinutes * MINUTE, MAX_SESSION_MS);

		onChange({ ms: nextMs > 0 ? nextMs : null, custom: true });
	}

	return (
		<View style={styles.picker}>
			<ItemGroup>
				<ItemRadio
					first
					label={t('session.start.untilEnd')}
					selected={!value.custom && value.ms === null}
					onPress={() => onChange({ ms: null, custom: false })}
				/>
				{SESSION_DURATION_PRESETS.map((preset) => (
					<ItemRadio
						key={preset}
						label={formatDuration(preset, locale)}
						selected={!value.custom && value.ms === preset}
						onPress={() => onChange({ ms: preset, custom: false })}
					/>
				))}
				<ItemRadio
					label={t('session.start.custom')}
					selected={value.custom}
					onPress={() => onChange({ ms: value.ms, custom: true })}
				/>
			</ItemGroup>

			{value.custom ? (
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
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	picker: { gap: 12 },
});
