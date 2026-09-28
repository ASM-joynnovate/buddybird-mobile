import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	onRetry?: () => void;
}

export function StartupScreen({ onRetry }: Props) {
	const { t } = useTranslation();

	return (
		<View style={styles.startup}>
			{onRetry ? (
				<>
					<Text allowFontScaling={false} style={styles.title}>
						{t('app.startup.title')}
					</Text>
					<Text allowFontScaling={false} style={styles.message}>
						{t('app.startup.message')}
					</Text>

					<PressableSurface onPress={onRetry} variant="plain" depth="none" contentStyle={styles.retry}>
						<Text allowFontScaling={false} style={styles.retryLabel}>
							{t('common.retry')}
						</Text>
					</PressableSurface>
				</>
			) : (
				<ActivityIndicator accessibilityLabel={t('app.startup.loading')} color={colors.orange} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	retry: { minHeight: 44, padding: 12, alignItems: 'center' },
	retryLabel: { fontSize: 18, color: colors.orange },
	startup: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
	title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
	message: { fontSize: 16, color: colors.text, marginBottom: 20 },
});
