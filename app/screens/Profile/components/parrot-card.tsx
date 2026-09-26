import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { isSpeciesId } from "@/services/profile/species"
import { colors, font } from "@/theme"
import type { Parrot } from "@/types/apis/parrots"
import { ageMonths } from "@/utils/date"
import { MONTHS_PER_YEAR } from "@/utils/units"

export function ParrotCard({ parrot, onPress }: { parrot: Parrot; onPress(): void }) {
	const { t } = useTranslation()

	const months = ageMonths(parrot.birthdate)
	const species = isSpeciesId(parrot.species)
		? t(`parrot.speciesNames.${parrot.species}`)
		: parrot.species
	let age: string | null = null

	if (months !== null) {
		age =
			months < MONTHS_PER_YEAR
				? t("profile.ageMonths", { count: months })
				: t("profile.ageYears", { count: Math.floor(months / MONTHS_PER_YEAR) })
	}

	return (
		<PressableSurface
			accessibilityLabel={[t("profile.openParrot", { name: parrot.name }), species, age]
				.filter(Boolean)
				.join(", ")}
			depth={2}
			onPress={onPress}
			contentStyle={styles.card}
		>
			<View style={styles.photo}>
				{parrot.photo ? (
					<Image source={{ uri: parrot.photo.url }} style={styles.image} />
				) : (
					<Icon name="photo" size={26} color={colors.disabled} />
				)}
			</View>
			<View style={styles.lines}>
				<Copy style={styles.name} numberOfLines={1}>
					{parrot.name}
				</Copy>
				<Copy style={styles.detail} numberOfLines={1}>
					{species}
				</Copy>
				{age ? <Copy style={styles.detail}>{age}</Copy> : null}
			</View>
			<Icon name="forward" size={18} color={colors.disabled} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
	photo: {
		width: 64,
		height: 64,
		borderRadius: 32,
		overflow: "hidden",
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	image: { width: "100%", height: "100%" },
	lines: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	detail: { fontSize: 14, color: colors.muted },
})
