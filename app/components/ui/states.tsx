import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function EmptyState({
	message,
	illustration,
	action,
}: {
	message: string
	illustration?: ReactNode
	action?: { label: string; onPress(): void }
}) {
	return (
		<View style={styles.center}>
			{illustration}
			<Copy style={styles.message}>{message}</Copy>
			{action ? (
				<Button label={action.label} onPress={action.onPress} style={styles.action} />
			) : null}
		</View>
	)
}

export function ScreenError({ message, onRetry }: { message: string; onRetry(): void }) {
	const { t } = useTranslation()

	return (
		<View style={styles.center} accessibilityLiveRegion="polite">
			<Icon name="warning" size={32} color={colors.muted} />
			<Copy style={styles.message}>{message}</Copy>
			<Button
				label={t("common.retry")}
				variant="secondary"
				icon="refresh"
				compact
				onPress={onRetry}
				style={styles.retry}
			/>
		</View>
	)
}

export function Preparing() {
	const { t } = useTranslation()

	return (
		<View style={styles.preparing}>
			<Copy style={styles.preparingText}>{t("common.preparing")}</Copy>
		</View>
	)
}

export function Skeleton({ rows = 3, height = 72 }: { rows?: number; height?: number }) {
	return (
		<View style={styles.skeleton} accessibilityElementsHidden>
			{Array.from({ length: rows }, (_, index) => (
				<View key={index} style={[styles.block, { height }]} />
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	center: { alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 32 },
	message: {
		fontFamily: font.extraBold,
		fontSize: 16,
		lineHeight: 22,
		color: colors.text,
		textAlign: "center",
	},
	action: { alignSelf: "stretch" },
	retry: { alignSelf: "flex-end" },
	preparing: {
		borderRadius: radius.card,
		borderCurve: "continuous",
		backgroundColor: colors.surface,
		paddingVertical: 24,
		paddingHorizontal: 16,
		alignItems: "center",
	},
	preparingText: { fontFamily: font.extraBold, fontSize: 14, color: colors.muted },
	skeleton: { gap: 10 },
	block: { borderRadius: radius.card, backgroundColor: colors.surface },
})
