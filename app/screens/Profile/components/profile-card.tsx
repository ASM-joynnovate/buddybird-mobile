import { useTranslation } from "react-i18next"

import { Image, StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { Copy } from "@/components/ui/text"
import { resolveRecordingUri } from "@/services/media/uri"
import { speciesIds } from "@/services/profile/species"
import { ageMonths } from "@/services/profile/statistics"
import { colors, font, radius } from "@/theme"
import type { Profile } from "@/types/profile"

export function ProfileCard({ profile }: { profile: Profile }) {
	const { t } = useTranslation()
	const age = ageMonths(profile.birthDate)
	const speciesLabel = speciesIds.includes(profile.species)
		? t(`species.${profile.species}`)
		: profile.species

	return (
		<Card tone="primary" cornerRadius={radius.hero} contentStyle={styles.profileCard}>
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
				{age !== null ? (
					<Copy style={styles.age}>{t("profile.age", { months: age })}</Copy>
				) : null}
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	profileCard: {
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	photo: {
		width: 84,
		height: 84,
		borderRadius: 42,
		backgroundColor: colors.orangeSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	parrot: { fontSize: 40 },
	details: { flex: 1 },
	name: { fontSize: 28, fontFamily: font.black, color: colors.onAccent },
	species: { marginTop: 6, fontSize: 20, color: colors.onAccent },
	birthDate: { fontSize: 14, marginTop: 6, color: colors.onAccent },
	age: {
		fontSize: 14,
		color: colors.text,
		backgroundColor: colors.orangeSoft,
		alignSelf: "flex-start",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: radius.pill,
		marginTop: 6,
	},
})
