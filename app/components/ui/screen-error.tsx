import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/types/apis/common';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { RotateCwIcon, ServerCrashIcon, WifiOffIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';

interface Props {
	error: unknown;
	placeholder?: ReactNode;
	loading?: boolean;
	onRetry: () => void;
}

export const ScreenError = ({ error, placeholder, loading, onRetry }: Props) => {
	const { t } = useTranslation();

	const connectionFailed =
		!(error instanceof ApiError) || error.code === 'CLIENT__NETWORK' || error.code === 'CLIENT__TIMEOUT';
	const Icon = connectionFailed ? WifiOffIcon : ServerCrashIcon;

	return (
		<View style={placeholder ? styles.overPlaceholder : null}>
			{/*로딩 중에 보이던 회색 막대*/}
			{placeholder && <View style={styles.placeholder}>{placeholder}</View>}

			<View style={styles.card} accessibilityLiveRegion="polite">
				<View style={styles.message}>
					<Icon size={22} color={colors.muted} style={styles.icon} />

					<View style={styles.texts}>
						<Copy style={styles.title}>{t('common.loadError')}</Copy>
						<Copy style={styles.reason}>{apiErrorMessage(error, t)}</Copy>
					</View>
				</View>

				<Button
					label={t('common.retry')}
					icon={RotateCwIcon}
					size="small"
					loading={loading}
					onPress={onRetry}
					style={styles.retry}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	overPlaceholder: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 12 },
	placeholder: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
	card: {
		gap: 12,
		padding: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	message: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
	icon: { marginTop: 1 },
	texts: { flex: 1, minWidth: 0, gap: 2 },
	title: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22 },
	reason: { fontSize: 14, lineHeight: 20, color: colors.muted },
	retry: { alignSelf: 'flex-end' },
});
