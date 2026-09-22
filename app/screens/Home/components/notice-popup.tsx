import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import type { Notice } from "@/apis/notices"
import { Dialog } from "@/components/dialogs/dialog"
import { Button } from "@/components/ui/button"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { colors, radius } from "@/theme"

export function NoticePopup({
	notice,
	onClose,
	onDetail,
}: {
	notice: Notice | null
	onClose(): void
	onDetail(id: string): void
}) {
	const { t } = useTranslation()
	const image = notice?.images[0]

	return (
		<Dialog
			visible={notice !== null}
			title={notice?.title ?? ""}
			onClose={onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={t("common.close")}
						variant="secondary"
						compact
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={t("home.notice.detail")}
						compact
						onPress={() => {
							if (notice) {
								onDetail(notice.id)
							}
						}}
						style={ui.action}
					/>
				</View>
			}
		>
			{image ? (
				<Image
					source={{ uri: image.url }}
					style={styles.image}
					resizeMode="cover"
					accessibilityIgnoresInvertColors
				/>
			) : null}
			{notice?.body ? <Copy numberOfLines={4}>{notice.body}</Copy> : null}
		</Dialog>
	)
}

const styles = StyleSheet.create({
	image: {
		width: "100%",
		aspectRatio: 16 / 9,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
})
