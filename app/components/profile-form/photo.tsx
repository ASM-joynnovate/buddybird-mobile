import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Avatar } from "@/components/ui/avatar"
import { Icon } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { PressableSurface } from "@/components/ui/surface"
import { resolveRecordingUri } from "@/services/media/uri"
import { colors } from "@/theme"

interface Props {
	photoUri?: string
	choosePhoto(): Promise<void>
	busy: boolean
	error?: string | null
	action?: "plus" | "edit"
}

export function ProfilePhoto({ photoUri, choosePhoto, busy, error, action = "edit" }: Props) {
	const { t } = useTranslation()

	return (
		<View style={styles.photoArea}>
			<PressableSurface
				accessibilityLabel={t("parrot.photo")}
				disabled={busy}
				onPress={() => void choosePhoto()}
				cornerRadius={55}
				depth={0}
			>
				<Avatar
					uri={photoUri ? resolveRecordingUri(photoUri) : null}
					icon="photo"
					size="xlarge"
				/>
				<View style={styles.photoPlus}>
					<Icon name={action} size={20} color={colors.onAccent} />
				</View>
			</PressableSurface>
			<InlineError message={error} />
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
