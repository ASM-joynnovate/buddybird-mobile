import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { TimePicker } from '@/components/time-picker';
import { Chip } from '@/components/ui/chip';
import { ui } from '@/components/ui/styles';

type Field = keyof SleepSettings;

const FIELDS: readonly Field[] = ['sleep_at', 'wake_at'];

interface Props {
	value: SleepSettings;
	onChange(value: SleepSettings): void;
}

export function SleepTimeEditor({ value, onChange }: Props) {
	const { t } = useTranslation();

	const [field, setField] = useState<Field>('sleep_at');

	return (
		<View style={styles.editor}>
			<View style={ui.row}>
				{FIELDS.map((item) => (
					<Chip
						key={item}
						label={t(`session.sleep.${item}`)}
						selected={field === item}
						onPress={() => setField(item)}
					/>
				))}
			</View>
			<TimePicker
				key={field}
				value={value[field]}
				label={t(`session.sleep.${field}`)}
				onChange={(time) => onChange({ ...value, [field]: time })}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	editor: { gap: 12 },
});
