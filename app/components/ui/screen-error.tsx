import { RotateCwIcon, TriangleAlertIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

interface Props {
	message: string
	onRetry(): void
}

export function ScreenError({ message, onRetry }: Props) {
	const { t } = useTranslation()

	return (
		<View style={styles.center} accessibilityLiveRegion="polite">
			<TriangleAlertIcon size={32} color={colors.muted} />
			<Copy style={styles.message}>{message}</Copy>
			<Button
				label={t("common.retry")}
				variant="secondary"
				icon={RotateCwIcon}
				compact
				onPress={onRetry}
				style={styles.retry}
			/>
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
	retry: { alignSelf: "flex-end" },
})
