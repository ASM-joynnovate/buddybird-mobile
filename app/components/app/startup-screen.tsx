import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	onRetry?: () => void;
}

/**
 * 앱 시작 준비 중에는 불러오는 중 표시를, 실패하면 실패 안내와 다시 시도 버튼을 보여 주는 화면
 * @param onRetry 다시 시도 버튼을 누를 때 실행할 함수, 없으면 불러오는 중 표시
 */
const StartupScreen = ({ onRetry }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			{onRetry ? (
				<>
					<Text allowFontScaling={false} style={styles.title}>
						{t('app.startupError.title')}
					</Text>
					<Text allowFontScaling={false} style={styles.message}>
						{t('app.startupError.message')}
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
};

const styles = StyleSheet.create({
	retry: { minHeight: 44, padding: 12, alignItems: 'center' },
	retryLabel: { fontSize: 18, color: colors.orange },
	container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
	title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
	message: { fontSize: 16, color: colors.text, marginBottom: 20 },
});

export default StartupScreen;
