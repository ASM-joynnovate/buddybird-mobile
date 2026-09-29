import { StyleSheet } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const variants = {
	plain: { surfaceVariant: 'plain', color: colors.text },
	muted: { surfaceVariant: 'plain', color: colors.muted },
	accent: { surfaceVariant: 'plain', color: colors.orange },
	primary: { surfaceVariant: 'primary', color: colors.onFilled },
} as const;

const iconSizes = { tiny: 15, small: 20, medium: 24, large: 28, xlarge: 34 } as const;

type IconButtonVariant = keyof typeof variants;

type IconButtonSize = keyof typeof iconSizes;

interface Props {
	icon: LucideIcon;
	label: string;
	onPress: () => void;
	disabled?: boolean;
	variant?: IconButtonVariant;
	size?: IconButtonSize;
}

const boxStyle = (size: IconButtonSize) => {
	return {
		tiny: boxes.tiny,
		small: boxes.small,
		medium: boxes.medium,
		large: boxes.large,
		xlarge: boxes.xlarge,
	}[size];
};

export const IconButton = ({ icon: Icon, label, onPress, disabled, variant = 'plain', size = 'medium' }: Props) => {
	const { surfaceVariant, color } = variants[variant];
	const isPrimary = variant === 'primary';

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			variant={isPrimary && disabled ? 'disabled' : surfaceVariant}
			depth={isPrimary ? 'medium' : 'none'}
			cornerRadius={isPrimary ? 'pill' : 'control'}
			style={[styles.shell, boxStyle(size)]}
			contentStyle={[styles.face, boxStyle(size)]}
		>
			<Icon color={disabled ? colors.subtle : color} size={iconSizes[size]} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	face: { flexGrow: 0, alignItems: 'center', justifyContent: 'center' },
});

const boxes = StyleSheet.create({
	tiny: { minWidth: 44, minHeight: 44 },
	small: { minWidth: 44, minHeight: 44 },
	medium: { minWidth: 48, minHeight: 48 },
	large: { minWidth: 64, minHeight: 64 },
	xlarge: { minWidth: 80, minHeight: 80 },
});
