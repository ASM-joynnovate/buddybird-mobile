import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { resolveRecordingUri } from "@/services/media/uri"
import { speciesIds } from "@/services/profile/species"
import { colors, font } from "@/theme"
import type { Profile } from "@/types/profile"

export function ProfileCard({ profile }: { profile: Profile }) {
	const { t } = useTranslation()
	const speciesLabel = speciesIds.includes(profile.species)
		? t(`species.${profile.species}`)
		: profile.species

	return (
		<Card tone="primary" cornerRadius={22} depth={4} contentStyle={styles.profileCard}>
			{profile.photoUri ? (
				<Image
					source={{ uri: resolveRecordingUri(profile.photoUri) }}
					style={styles.photo}
				/>
			) : (
				<View style={styles.photo}>
					<Copy style={styles.parrot}>🦜</Copy>
				</View>
			)}
			<View style={styles.details}>
				<Copy testID="profile-display-name" style={styles.name}>
					{profile.name}
				</Copy>
				<Copy style={styles.species}>{speciesLabel}</Copy>
				{profile.birthDate ? (
					<Copy testID="profile-birth-date" style={styles.birthDate}>
						{`${profile.birthDate.split("-").map(Number).join(". ")}.`}
					</Copy>
				) : null}
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	profileCard: {
		padding: 20,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: 16,
	},
	photo: {
		width: "25%",
		maxWidth: 80,
		aspectRatio: 1,
		borderRadius: 40,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
	parrot: { fontSize: 36 },
	details: { flexGrow: 1, flexShrink: 1, flexBasis: "60%", minWidth: 0 },
	name: { fontSize: 24, lineHeight: 30, fontFamily: font.black, color: colors.onAccent },
	species: { marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.onAccent },
	birthDate: { fontSize: 12, lineHeight: 16, marginTop: 3, color: colors.onAccent },
})
