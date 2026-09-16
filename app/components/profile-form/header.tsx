import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { Title } from "@/components/ui/text"

export function ProfileFormHeader({ busy, onBack }: { busy: boolean; onBack(): void }) {
	const { t } = useTranslation()

	return (
		<View style={styles.header}>
			<IconButton icon="back" label={t("common.back")} disabled={busy} onPress={onBack} />
			<Title style={styles.title}>{t("profile.edit")}</Title>
		</View>
	)
}

const styles = StyleSheet.create({
	title: { flex: 1, minWidth: 0 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginLeft: -8,
		marginBottom: 20,
	},
})
