import { StyleSheet } from 'react-native';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

import { colors } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const variants = {
	plain: { surfaceVariant: 'plain', color: colors.text, shape: 'square' },
	muted: { surfaceVariant: 'plain', color: colors.muted, shape: 'square' },
	accent: { surfaceVariant: 'plain', color: colors.orange, shape: 'square' },
	primary: { surfaceVariant: 'primary', color: colors.onFilled, shape: 'circle' },
	onBrand: { surfaceVariant: 'plain', color: colors.onBrand, shape: 'square' },
} as const;

const cornerRadii = { circle: 'pill', square: 'control' } as const;

const iconSizes = { tiny: 15, small: 20, medium: 24, large: 28, xlarge: 34 } as const;

type IconButtonVariant = keyof typeof variants;

type IconButtonShape = keyof typeof cornerRadii;

type IconButtonSize = keyof typeof iconSizes;

interface Props {
	icon: LucideIcon;
	iconProps?: LucideProps;
	label: string;
	onPress: () => void;
	disabled?: boolean;
	variant?: IconButtonVariant;
	shape?: IconButtonShape;
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

export const IconButton = ({
	icon: Icon,
	iconProps,
	label,
	onPress,
	disabled,
	variant = 'plain',
	shape,
	size = 'medium',
}: Props) => {
	const { surfaceVariant, color, shape: variantShape } = variants[variant];
	const isPrimary = variant === 'primary';
	const buttonShape = shape ?? variantShape;

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			variant={isPrimary && disabled ? 'disabled' : surfaceVariant}
			depth={isPrimary ? 'medium' : 'none'}
			cornerRadius={cornerRadii[buttonShape]}
			style={[styles.shell, boxStyle(size)]}
			contentStyle={[styles.face, boxStyle(size)]}
		>
			<Icon color={disabled ? colors.subtle : color} size={iconSizes[size]} {...iconProps} />
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
