import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { TextField } from "@/components/ui/text-field"
import { speciesGroups } from "@/services/profile/species"
import { colors } from "@/theme"

export function SpeciesPicker({
	custom,
	setCustom,
	customSpecies,
	setCustomSpecies,
	species,
	setSpecies,
	busy,
	speciesError,
}: {
	custom: boolean
	setCustom(value: boolean): void
	customSpecies: string
	setCustomSpecies(value: string): void
	species: string
	setSpecies(value: string): void
	busy: boolean
	speciesError: string | null
}) {
	const { t } = useTranslation()

	return (
		<>
			<View style={styles.labelRow}>
				<Copy style={[ui.label, styles.noMargin]}>{t("profile.species")}</Copy>
				<Chip
					label={t(custom ? "common.selected" : "profile.custom")}
					selected={custom}
					disabled={busy}
					onPress={() => setCustom(!custom)}
				/>
			</View>
			{custom ? (
				<TextField
					testID="profile-custom-species"
					accessibilityLabel={t("profile.species")}
					value={customSpecies}
					onChangeText={setCustomSpecies}
					editable={!busy}
					maxLength={50}
					placeholder={t("profile.customHint")}
				/>
			) : (
				Object.entries(speciesGroups).map(([group, items]) => (
					<View key={group} style={styles.group}>
						<Copy style={styles.groupLabel}>{t(`groups.${group}`)}</Copy>
						<View style={ui.wrap}>
							{items.map((id) => (
								<Chip
									key={id}
									testID={`species-${id}`}
									label={t(`species.${id}`)}
									selected={species === id}
									disabled={busy}
									onPress={() => setSpecies(id)}
								/>
							))}
						</View>
					</View>
				))
			)}
			<InlineError message={speciesError} />
		</>
	)
}

const styles = StyleSheet.create({
	labelRow: {
		flexWrap: "wrap",
		gap: 10,
		marginTop: 24,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	noMargin: { marginBottom: 0 },
	group: { marginBottom: 10 },
	groupLabel: { fontSize: 12, color: colors.muted, marginBottom: 8 },
})
