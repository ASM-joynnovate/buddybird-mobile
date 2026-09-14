import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { resolveRecordingUri } from "@/services/media/uri"
import { colors } from "@/theme"

export function ProfilePhoto({
	photoUri,
	choosePhoto,
	busy,
}: {
	photoUri?: string
	choosePhoto(): Promise<void>
	busy: boolean
}) {
	const { t } = useTranslation()

	return (
		<View style={styles.photoArea}>
			<PressableSurface
				testID="profile-photo"
				accessibilityLabel={t("profile.photo")}
				disabled={busy}
				onPress={() => void choosePhoto()}
				cornerRadius={60}
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
					<Icon name="plus" size={28} color={colors.onAccent} />
				</View>
			</PressableSurface>
		</View>
	)
}

const styles = StyleSheet.create({
	photoArea: { width: 120, height: 130, alignSelf: "center", marginBottom: 24 },
	photoTouch: { width: 120, height: 124 },
	photoPreview: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	photo: { width: 114, height: 114, borderRadius: 57 },
	parrot: { fontSize: 56 },
	photoPlus: {
		position: "absolute",
		right: -5,
		bottom: -5,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.orange,
		borderWidth: 3,
		borderColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
})
