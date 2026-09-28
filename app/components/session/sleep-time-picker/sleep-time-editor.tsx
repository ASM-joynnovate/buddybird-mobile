import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { TimePicker } from '@/components/time-picker';
import { Chip } from '@/components/ui/chip';
import { ui } from '@/components/ui/styles';

type SleepTimeField = keyof SleepSettings;

const SLEEP_TIME_FIELDS: readonly SleepTimeField[] = ['sleep_at', 'wake_at'];

interface Props {
	value: SleepSettings;
	onChange(value: SleepSettings): void;
}

export function SleepTimeEditor({ value, onChange }: Props) {
	const { t } = useTranslation();

	const [selectedField, setSelectedField] = useState<SleepTimeField>('sleep_at');

	return (
		<View style={styles.editor}>
			<View style={ui.row}>
				{SLEEP_TIME_FIELDS.map((field) => (
					<Chip
						key={field}
						label={t(`session.sleep.${field}`)}
						selected={selectedField === field}
						onPress={() => setSelectedField(field)}
					/>
				))}
			</View>
			<TimePicker
				key={selectedField}
				value={value[selectedField]}
				label={t(`session.sleep.${selectedField}`)}
				onChange={(time) => onChange({ ...value, [selectedField]: time })}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	editor: { gap: 12 },
});
