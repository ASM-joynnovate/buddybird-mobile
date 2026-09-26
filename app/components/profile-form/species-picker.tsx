import { BottomSheetSectionList } from "@gorhom/bottom-sheet"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { type SectionList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PickerRow, RadioRow } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { isSpeciesId, speciesGroups, type SpeciesId, speciesIds } from "@/services/profile/species"
import { colors, font } from "@/theme"

type SpeciesGroup = keyof typeof speciesGroups
type Section = { key: SpeciesGroup; data: readonly SpeciesId[] }

const MAX_SCROLL_RETRIES = 3
const SCROLL_DELAY_MS = 150

const sections: Section[] = (Object.keys(speciesGroups) as SpeciesGroup[]).map((key) => ({
	key,
	data: speciesGroups[key],
}))

interface Props {
	species: string
	setSpecies(value: string): void
	busy: boolean
	first?: boolean
}

export function SpeciesPicker({ species, setSpecies, busy, first }: Props) {
	const { t } = useTranslation()

	const insets = useSafeAreaInsets()

	const list = useRef<SectionList<SpeciesId, Section>>(null)
	const scrollRetries = useRef(0)

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
		<PickerRow
			row={{
				first,
				label: t("parrot.species"),
				value: isSpeciesId(species)
					? t(`parrot.speciesNames.${species}`)
					: t("parrot.choose"),
				disabled: busy,
			}}
			sheet={{
				title: t("parrot.speciesQuestion"),
				list: true,
				onOpened: () => {
					scrollRetries.current = 0
					setTimeout(showSelected, SCROLL_DELAY_MS)
				},
			}}
		>
			{(close) => (
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
					contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
					renderSectionHeader={({ section }: { section: Section }) => (
						<View style={styles.header}>
							<Copy accessibilityRole="header" style={styles.headerText}>
								{t(`parrot.speciesGroups.${section.key}`)}
							</Copy>
						</View>
					)}
					renderItem={({ item, index }: { item: SpeciesId; index: number }) => (
						<RadioRow
							first={index === 0}
							label={t(`parrot.speciesNames.${item}`)}
							selected={species === item}
							onPress={() => {
								setSpecies(item)
								close()
							}}
						/>
					)}
				/>
			)}
		</PickerRow>
	)
}

const styles = StyleSheet.create({
	list: { paddingHorizontal: 10 },
	header: {
		backgroundColor: colors.background,
		paddingHorizontal: 14,
		paddingTop: 16,
		paddingBottom: 8,
	},
	headerText: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
})
