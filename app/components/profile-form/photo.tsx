import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Avatar } from "@/components/ui/avatar"
import { Icon } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, NavRow } from "@/components/ui/rows"
import { Sheet } from "@/components/ui/sheet"
import { PressableSurface } from "@/components/ui/surface"
import type { usePhotoPicker } from "@/hooks/use-photo-picker"
import { colors } from "@/theme"

interface Props {
	photo: ReturnType<typeof usePhotoPicker>
	busy: boolean
	action?: "plus" | "edit"
}

export function ProfilePhoto({ photo, busy, action = "edit" }: Props) {
	const { t } = useTranslation()

	const [sheetOpen, setSheetOpen] = useState(false)

	return (
		<View style={styles.photoArea}>
			<PressableSurface
				accessibilityLabel={t("parrot.photo")}
				disabled={busy}
				onPress={() => setSheetOpen(true)}
				cornerRadius={55}
				depth={0}
			>
				<Avatar uri={photo.photoUri} icon="photo" size="xlarge" />
				<View style={styles.photoPlus}>
					<Icon name={action} size={20} color={colors.onAccent} />
				</View>
			</PressableSurface>
			<InlineError message={photo.error} />
			<Sheet
				visible={sheetOpen}
				title={t("parrot.photoSheet.title")}
				onClose={() => setSheetOpen(false)}
			>
				<GroupedList>
					<NavRow
						first
						label={t("parrot.photoSheet.take")}
						onPress={() => {
							setSheetOpen(false)

							void photo.take()
						}}
					/>
					<NavRow
						label={t("parrot.photoSheet.choose")}
						onPress={() => {
							setSheetOpen(false)

							void photo.choose()
						}}
					/>
				</GroupedList>
			</Sheet>
		</View>
	)
}

const styles = StyleSheet.create({
	photoArea: { alignItems: "center", marginBottom: 20, gap: 10 },
	photoPlus: {
		position: "absolute",
		right: -2,
		bottom: -2,
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: colors.orange,
		borderWidth: 3,
		borderColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
})
