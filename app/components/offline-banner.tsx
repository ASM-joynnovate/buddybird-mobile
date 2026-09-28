import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOffIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

export function OfflineBanner() {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const { isConnected } = useNetInfo();

	if (isConnected !== false) {
		return null;
	}

	return (
		<View
			pointerEvents="none"
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			style={[styles.wrap, { top: insets.top + 4 }]}
		>
			<View style={styles.banner}>
				<WifiOffIcon size={18} color={colors.onAccent} />
				<Copy style={styles.text}>{t('common.offline')}</Copy>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
	banner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		maxWidth: contentMaxWidth,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.text,
	},
	text: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13.5, color: colors.onAccent },
});
