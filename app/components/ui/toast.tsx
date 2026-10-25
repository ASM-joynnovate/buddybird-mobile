import { Platform, StyleSheet, View } from 'react-native';

import { CheckIcon, XIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

export const TOAST_DURATION_MS = 3 * SECOND;

export const dialogToasterId = Platform.OS === 'android' ? 'dialog' : undefined;

interface ToastAction {
	label: string;
	onPress: () => void;
}

interface Props {
	variant?: 'success' | 'error';
	message: string;
	action?: ToastAction;
}

export const Toast = ({ variant = 'success', message, action }: Props) => {
	const Icon = variant === 'error' ? XIcon : CheckIcon;

	const handlePressAction = () => {
		toast.dismiss();

		action?.onPress();
	};

	return (
		<View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.container}>
			<View style={[styles.iconCircle, variant === 'error' && styles.errorIconCircle]}>
				<Icon size={14} strokeWidth={3.5} color={colors.onFilled} />
			</View>

			<Copy style={styles.message}>{message}</Copy>

			{action && (
				<PressableSurface
					accessibilityLabel={action.label}
					onPress={handlePressAction}
					variant="plain"
					depth="none"
					cornerRadius="small"
					contentStyle={styles.actionButton}
				>
					<Copy style={styles.actionLabel}>{action.label}</Copy>
				</PressableSurface>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
		paddingLeft: 14,
		paddingRight: 8,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.text,
	},
	iconCircle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.green,
	},
	errorIconCircle: { backgroundColor: colors.error },
	message: { flex: 1, fontFamily: font.extraBold, fontSize: 13.5, lineHeight: 19, color: colors.onFilled },
	actionButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 8, borderWidth: 0 },
	actionLabel: { fontFamily: font.extraBold, fontSize: 13.5, color: colors.orange },
});
