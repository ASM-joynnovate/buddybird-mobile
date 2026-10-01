import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { ArrowRightIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import TimePicker from '@/components/time-picker';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

const TIME_PICKER_MAX_WIDTH = 160;
const ARROW_SIZE = 20;
const FIELD_GAP = 12;

interface Props {
	value: SleepSettings;
	onChange: (value: SleepSettings) => void;
	onClose: () => void;
}

/**
 * 수면 시간 편집 컴포넌트
 * @param value 수면 시간
 * @param onChange 저장 버튼을 눌렀을 때 실행할 함수
 * @param onClose bottom sheet를 닫는 함수
 */
const SleepTimeEditor = ({ value, onChange, onClose }: Props) => {
	const { t } = useTranslation();

	const [draft, setDraft] = useState(value);

	const handleSave = () => {
		onChange(draft);
		onClose();
	};

	return (
		<View style={styles.container}>
			<View style={styles.labelsRow}>
				<Copy style={[ui.label, styles.label]}>{t('session.sleep.sleep_at')}</Copy>
				<Copy style={[ui.label, styles.label]}>{t('session.sleep.wake_at')}</Copy>
			</View>

			<View style={styles.pickersRow}>
				<View style={styles.picker}>
					<TimePicker
						value={draft.sleep_at}
						label={t('session.sleep.sleep_at')}
						onChange={(time) => setDraft((current) => ({ ...current, sleep_at: time }))}
					/>
				</View>
				<ArrowRightIcon size={ARROW_SIZE} color={colors.muted} />
				<View style={styles.picker}>
					<TimePicker
						value={draft.wake_at}
						label={t('session.sleep.wake_at')}
						onChange={(time) => setDraft((current) => ({ ...current, wake_at: time }))}
					/>
				</View>
			</View>

			<View style={[ui.actionsRow, styles.actions]}>
				<Button
					label={t('common.cancel')}
					variant="secondary"
					size="small"
					onPress={onClose}
					style={ui.action}
				/>
				<Button label={t('common.save')} size="small" onPress={handleSave} style={ui.action} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingTop: 16 },
	labelsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: ARROW_SIZE + FIELD_GAP * 2 },
	label: { flex: 1, maxWidth: TIME_PICKER_MAX_WIDTH, textAlign: 'center' },
	pickersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: FIELD_GAP },
	picker: { flex: 1, maxWidth: TIME_PICKER_MAX_WIDTH },
	actions: { marginTop: 24 },
});

export default SleepTimeEditor;
