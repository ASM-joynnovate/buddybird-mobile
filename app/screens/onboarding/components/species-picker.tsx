import { useRef } from 'react';

import { type SectionList, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font } from '@/theme';
import { isSpeciesId, speciesGroups, type SpeciesId } from '@/utils/species';

import { Copy } from '@/components/ui/copy';
import { ItemPicker } from '@/components/ui/item/picker';
import { ItemRadio } from '@/components/ui/item/radio';

type SpeciesGroup = keyof typeof speciesGroups;
type Section = { key: SpeciesGroup; data: readonly SpeciesId[] };

const MAX_SCROLL_RETRIES = 3;
const SCROLL_DELAY_MS = 150;

interface Props {
	species: string;
	setSpecies(value: string): void;
	busy: boolean;
	first?: boolean;
}

export function SpeciesPicker({ species, setSpecies, busy, first }: Props) {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const list = useRef<SectionList<SpeciesId, Section>>(null);
	const scrollRetries = useRef(0);

	const sections: Section[] = Object.entries(speciesGroups).map(([group, data]) => ({
		key: group as SpeciesGroup,
		data,
	}));

	function showSelected() {
		if (!isSpeciesId(species)) {
			return;
		}

		const sectionIndex = sections.findIndex((section) => section.data.includes(species));

		if (sectionIndex < 0) {
			return;
		}

		list.current?.scrollToLocation({
			sectionIndex,
			itemIndex: sections[sectionIndex].data.indexOf(species),
			viewPosition: 0.5,
			animated: false,
		});
	}

	return (
		<ItemPicker
			item={{
				first,
				label: t('parrot.species'),
				value: isSpeciesId(species) ? t(`parrot.speciesNames.${species}`) : t('parrot.choose'),
				disabled: busy,
			}}
			sheet={{
				title: t('parrot.speciesQuestion'),
				list: true,
				onOpened: () => {
					scrollRetries.current = 0;

					setTimeout(showSelected, SCROLL_DELAY_MS);
				},
			}}
		>
			{(close) => (
				<BottomSheetSectionList
					ref={list}
					sections={sections}
					keyExtractor={(id: SpeciesId) => id}
					stickySectionHeadersEnabled
					initialNumToRender={sections.flatMap((section) => section.data).length}
					onScrollToIndexFailed={() => {
						if (scrollRetries.current < MAX_SCROLL_RETRIES) {
							scrollRetries.current += 1;

							requestAnimationFrame(showSelected);
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
						<ItemRadio
							first={index === 0}
							label={t(`parrot.speciesNames.${item}`)}
							selected={species === item}
							onPress={() => {
								setSpecies(item);

								close();
							}}
						/>
					)}
				/>
			)}
		</ItemPicker>
	);
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
});
