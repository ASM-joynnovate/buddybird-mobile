import { StyleSheet } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	label: string;
	onPress(): void;
	disabled?: boolean;
	variant?: 'primary' | 'muted';
}

export function TextButton({ label, onPress, disabled, variant = 'primary' }: Props) {
	return (
		<PressableSurface
			accessibilityLabel={label}
			disabled={disabled}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="control"
			contentStyle={styles.textButton}
		>
			<Copy style={[styles.textButtonLabel, variant === 'muted' && styles.muted, disabled && styles.disabled]}>
				{label}
			</Copy>
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderWidth: 0 },
	textButtonLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
	muted: { color: colors.muted },
	disabled: { color: colors.subtle },
});
