import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { InlineError } from "@/components/ui/inline-error"
import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { resolveRecordingUri } from "@/services/media/uri"
import { colors } from "@/theme"

export function ProfilePhoto({
	photoUri,
	choosePhoto,
	busy,
	error,
	action = "edit",
}: {
	photoUri?: string
	choosePhoto(): Promise<void>
	busy: boolean
	error?: string | null
	action?: "plus" | "edit"
}) {
	const { t } = useTranslation()

	return (
		<View style={styles.photoArea}>
			<PressableSurface
				testID="profile-photo"
				accessibilityLabel={t("profile.photo")}
				disabled={busy}
				onPress={() => void choosePhoto()}
				cornerRadius={55}
				depth={0}
				style={styles.photoTouch}
				contentStyle={styles.photoPreview}
			>
				{photoUri ? (
					<Image source={{ uri: resolveRecordingUri(photoUri) }} style={styles.photo} />
				) : (
					<Copy allowFontScaling={false} style={styles.parrot}>
						🦜
					</Copy>
				)}
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
	photoTouch: { width: "40%", maxWidth: 110, aspectRatio: 1 },
	photoPreview: {
		aspectRatio: 1,
		borderRadius: 55,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	photo: { width: "100%", aspectRatio: 1, borderRadius: 55 },
	parrot: { fontSize: 52 },
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
