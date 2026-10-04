import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, depths, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	index: number;
	selected: boolean;
	recorded: boolean;
	locked: boolean;
	disabled: boolean;
	onPress: () => void;
}

/**
 * 녹음 단계 버튼 컴포넌트
 * @param index 녹음 단계 순서
 * @param selected 현재 보고 있는 단계인지 여부
 * @param recorded 녹음이 있는 단계인지 여부
 * @param locked 아직 이동할 수 없는 단계인지 여부
 * @param disabled 버튼 비활성 여부
 * @param onPress 버튼을 누를 때 실행할 함수
 */
const RecordingStepItem = ({ index, selected, recorded, locked, disabled, onPress }: Props) => {
	const { t } = useTranslation();

	let numberColor = colors.subtle;

	if (selected) {
		numberColor = colors.onFilled;
	} else if (locked) {
		numberColor = colors.border;
	} else if (recorded) {
		numberColor = colors.text;
	}

	return (
		<PressableSurface
			accessibilityRole="tab"
			accessibilityLabel={t('words.editor.recordingName', { index: index + 1 })}
			accessibilityState={{ selected }}
			disabled={disabled || locked}
			onPress={onPress}
			variant={selected ? 'primary' : 'neutral'}
			faceColor={locked ? colors.surface : undefined}
			edgeColor={locked ? colors.surface : undefined}
			depth={locked ? 'none' : 'low'}
			cornerRadius="tile"
			style={[styles.shell, locked && styles.lockedShell]}
			contentStyle={styles.step}
		>
			<Copy style={[styles.number, { color: numberColor }]}>{index + 1}</Copy>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	shell: { flex: 1 },
	lockedShell: { marginTop: depths.low },
	step: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
	number: { fontFamily: font.black, fontSize: 16, fontVariant: ['tabular-nums'] },
});

export default RecordingStepItem;
