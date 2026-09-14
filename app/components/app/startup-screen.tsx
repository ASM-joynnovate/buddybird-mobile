import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

import { PressableSurface } from "@/components/ui/surface"

import { colors } from "@/theme"

export function StartupScreen({ failed, onRetry }: { failed: boolean; onRetry(): void }) {
	const { t } = useTranslation()

	return (
		<View style={styles.startup}>
			{failed ? (
				<>
					<Text allowFontScaling={false} style={styles.title}>
						{t("startup.title")}
					</Text>
					<Text allowFontScaling={false} style={styles.message}>
						{t("startup.message")}
					</Text>
					<PressableSurface
						onPress={onRetry}
						tone="plain"
						depth={0}
						contentStyle={styles.retry}
					>
						<Text allowFontScaling={false} style={styles.retryLabel}>
							{t("startup.retry")}
						</Text>
					</PressableSurface>
				</>
			) : (
				<ActivityIndicator
					accessibilityLabel={t("startup.loading")}
					color={colors.orange}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	retry: { minHeight: 44, padding: 12, alignItems: "center" },
	retryLabel: { fontSize: 18, color: colors.orange },
	startup: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.background },
	title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 12 },
	message: { fontSize: 16, color: colors.text, marginBottom: 20 },
})
