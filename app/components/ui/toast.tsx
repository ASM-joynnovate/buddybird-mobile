import { StyleSheet, View } from 'react-native';

import { CheckIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	message: string;
	action?: { label: string; onPress: () => void };
}

/**
 * 진한 회색 토스트 컴포넌트
 * @param message 토스트 문구
 * @param action 오른쪽 버튼의 문구 및 누를 때 실행할 함수
 */
export const Toast = ({ message, action }: Props) => {
	const handlePressAction = () => {
		toast.dismiss();

		action?.onPress();
	};

	return (
		<View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.container}>
			<View style={styles.checkCircle}>
				<CheckIcon size={14} strokeWidth={3.5} color={colors.onFilled} />
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
	checkCircle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.green,
	},
	message: { flex: 1, fontFamily: font.extraBold, fontSize: 13.5, lineHeight: 19, color: colors.onFilled },
	actionButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 8, borderWidth: 0 },
	actionLabel: { fontFamily: font.extraBold, fontSize: 13.5, color: colors.orange },
});
