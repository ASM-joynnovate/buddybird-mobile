import { BottomSheetSectionList } from "@gorhom/bottom-sheet"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type SectionList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Polyline } from "react-native-svg"

import { NavRow } from "@/components/ui/rows"
import { Sheet } from "@/components/ui/sheet"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { isSpeciesId, speciesGroups, type SpeciesId, speciesIds } from "@/services/profile/species"
import { colors, font } from "@/theme"

type SpeciesGroup = keyof typeof speciesGroups
type Section = { key: SpeciesGroup; data: readonly SpeciesId[] }

const MAX_SCROLL_RETRIES = 3
const SCROLL_DELAY_MS = 150
const CHECK_SIZE = 16

const sections: Section[] = (Object.keys(speciesGroups) as SpeciesGroup[]).map((key) => ({
	key,
	data: speciesGroups[key],
}))

export function SpeciesPicker({
	species,
	setSpecies,
	busy,
	first,
}: {
	species: string
	setSpecies(value: string): void
	busy: boolean
	first?: boolean
}) {
	const { t } = useTranslation()
	const insets = useSafeAreaInsets()
	const [open, setOpen] = useState(false)
	const list = useRef<SectionList<SpeciesId, Section>>(null)
	const scrollRetries = useRef(0)

	function choose(id: string) {
		setSpecies(id)
		setOpen(false)
	}

	function showSelected() {
		if (!isSpeciesId(species)) {
			return
		}

		const sectionIndex = sections.findIndex((section) => section.data.includes(species))

		if (sectionIndex < 0) {
			return
		}

		list.current?.scrollToLocation({
			sectionIndex,
			itemIndex: sections[sectionIndex].data.indexOf(species),
			viewPosition: 0.5,
			animated: false,
		})
	}

	return (
		<>
			<NavRow
				first={first}
				label={t("parrot.species")}
				value={
					isSpeciesId(species) ? t(`parrot.speciesNames.${species}`) : t("parrot.choose")
				}
				disabled={busy}
				onPress={() => setOpen(true)}
			/>
			<Sheet
				list
				visible={open}
				title={t("parrot.speciesQuestion")}
				onClose={() => setOpen(false)}
				onOpened={() => {
					scrollRetries.current = 0
					setTimeout(showSelected, SCROLL_DELAY_MS)
				}}
			>
				<BottomSheetSectionList
					ref={list}
					sections={sections}
					keyExtractor={(id: SpeciesId) => id}
					stickySectionHeadersEnabled
					initialNumToRender={speciesIds.length}
					onScrollToIndexFailed={() => {
						if (scrollRetries.current < MAX_SCROLL_RETRIES) {
							scrollRetries.current += 1
							requestAnimationFrame(showSelected)
						}
					}}
					contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
					renderSectionHeader={({ section }: { section: Section }) => (
						<View style={styles.header}>
							<Copy accessibilityRole="header" style={styles.headerText}>
								{t(`parrot.speciesGroups.${section.key}`)}
							</Copy>
						</View>
					)}
					renderItem={({ item, index }: { item: SpeciesId; index: number }) => (
						<SpeciesRow
							label={t(`parrot.speciesNames.${item}`)}
							selected={species === item}
							divider={index > 0}
							onPress={() => choose(item)}
						/>
					)}
				/>
			</Sheet>
		</>
	)
}

function SpeciesRow({
	label,
	selected,
	divider,
	onPress,
}: {
	label: string
	selected: boolean
	divider: boolean
	onPress(): void
}) {
	return (
		<PressableSurface
			accessibilityRole="radio"
			accessibilityLabel={label}
			accessibilityState={{ checked: selected }}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={divider && styles.divider}
			contentStyle={styles.row}
		>
			<Copy style={[styles.label, selected && styles.selectedLabel]}>{label}</Copy>
			{selected ? (
				<Svg width={CHECK_SIZE} height={CHECK_SIZE} viewBox="0 0 14 14">
					<Polyline
						points="2.5,7.5 5.8,10.5 11.5,3.8"
						fill="none"
						stroke={colors.orangeDark}
						strokeWidth={3.2}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</Svg>
			) : null}
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	header: {
		backgroundColor: colors.background,
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 8,
	},
	headerText: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	row: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 24,
		borderWidth: 0,
	},
	label: { flex: 1, fontFamily: font.extraBold, fontSize: 16, color: colors.text },
	selectedLabel: { color: colors.orangeDark },
})
