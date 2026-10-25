import { StyleSheet } from 'react-native';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

import { colors } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const variants = {
	plain: { surfaceVariant: 'plain', color: colors.text, shape: 'square' },
	muted: { surfaceVariant: 'plain', color: colors.muted, shape: 'square' },
	primary: { surfaceVariant: 'primary', color: colors.onFilled, shape: 'circle' },
	onBrand: { surfaceVariant: 'plain', color: colors.onBrand, shape: 'square' },
} as const;

const cornerRadii = { circle: 'pill', square: 'control' } as const;

const sizes = {
	compact: { icon: 16, box: 36 },
	tiny: { icon: 15, box: 44 },
	small: { icon: 20, box: 44 },
	medium: { icon: 24, box: 48 },
} as const;

const COMPACT_HIT_SLOP = 4;

type IconButtonVariant = keyof typeof variants;

type IconButtonShape = keyof typeof cornerRadii;

type IconButtonSize = keyof typeof sizes;

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
	const surfaceRaised = variant === 'primary';
	const buttonShape = shape ?? variantShape;
	const boxStyle = { minWidth: sizes[size].box, minHeight: sizes[size].box };

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: Boolean(disabled) }}
			disabled={disabled}
			onPress={onPress}
			hitSlop={size === 'compact' ? COMPACT_HIT_SLOP : undefined}
			variant={surfaceRaised && disabled ? 'disabled' : surfaceVariant}
			depth={surfaceRaised ? 'medium' : 'none'}
			cornerRadius={cornerRadii[buttonShape]}
			style={[styles.shell, boxStyle]}
			contentStyle={[styles.face, boxStyle]}
		>
			<Icon color={disabled ? colors.subtle : color} size={sizes[size].icon} {...iconProps} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	shell: { flexShrink: 0 },
	face: { flexGrow: 0, alignItems: 'center', justifyContent: 'center' },
});
