import { ActivityIndicator, StyleSheet } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors, depths, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface, type PressableSurfaceProps } from '@/components/ui/surface/pressable-surface';

interface Props extends Omit<PressableSurfaceProps, 'children' | 'variant'> {
	label: string;
	icon?: LucideIcon;
	variant?: 'primary' | 'secondary';
	loading?: boolean;
	size?: 'small' | 'medium';
}

export function Button({
	label,
	icon: Icon,
	variant = 'primary',
	loading,
	size = 'medium',
	style,
	disabled,
	...props
}: Props) {
	const inactive = disabled || loading;
	const depth = size === 'small' ? 'high' : 'xhigh';
	let surfaceVariant: 'primary' | 'neutral' | 'disabled' = 'primary';
	let foregroundColor = colors.onFilled;

	if (variant === 'secondary') {
		surfaceVariant = 'neutral';
		foregroundColor = colors.text;
	}

	if (inactive) {
		surfaceVariant = 'disabled';
		foregroundColor = colors.subtle;
	}

	let leadingContent = null;

	if (loading) {
		leadingContent = <ActivityIndicator color={foregroundColor} />;
	} else if (Icon) {
		leadingContent = <Icon color={foregroundColor} size={size === 'small' ? 20 : 26} />;
	}

	return (
		<PressableSurface
			{...props}
			accessibilityRole="button"
			accessibilityLabel={props.accessibilityLabel ?? label}
			accessibilityState={{
				...props.accessibilityState,
				disabled: Boolean(inactive),
				busy: Boolean(loading),
			}}
			disabled={inactive}
			variant={surfaceVariant}
			depth={inactive ? 'none' : depth}
			cornerRadius="control"
			style={[inactive && { marginTop: depths[depth] }, style]}
			contentStyle={[
				styles.button,
				{ borderWidth: variant === 'secondary' ? 2 : 0 },
				size === 'small' && styles.compact,
			]}
		>
			{leadingContent}
			<Copy style={[styles.buttonText, { color: foregroundColor }, size === 'small' && styles.compactText]}>
				{label}
			</Copy>
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	button: {
		minHeight: 58,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingHorizontal: 22,
		paddingVertical: 10,
	},
	buttonText: {
		fontFamily: font.extraBold,
		fontSize: 16,
		letterSpacing: 0.32,
		textTransform: 'uppercase',
		textAlign: 'center',
		flexShrink: 1,
		minWidth: 0,
	},
	compact: {
		minHeight: 42,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	compactText: { fontSize: 16 },
});
