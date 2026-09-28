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
interface Section {
	key: SpeciesGroup;
	data: readonly SpeciesId[];
}

const MAX_SCROLL_RETRIES = 3;
const SCROLL_DELAY_MS = 150;

interface Props {
	species: string;
	setSpecies: (value: string) => void;
	disabled: boolean;
	first?: boolean;
}

/**
 * 고른 종을 보여 주고 누르면 소형, 중형, 대형으로 나눈 종 목록 시트를 여는 컴포넌트
 * @param species 고른 종 ID
 * @param setSpecies 종을 고를 때 실행할 함수
 * @param disabled 선택 비활성화 여부
 * @param first 위쪽 구분선이 없는 첫 항목 여부
 */
const SpeciesPicker = ({ species, setSpecies, disabled, first }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const listRef = useRef<SectionList<SpeciesId, Section>>(null);
	const scrollRetriesRef = useRef(0);

	const sections: Section[] = Object.entries(speciesGroups).map(([group, data]) => ({
		key: group as SpeciesGroup,
		data,
	}));

	/** 고른 종이 목록 가운데에 오도록 스크롤 */
	const scrollToSelected = () => {
		if (!isSpeciesId(species)) {
			return;
		}

		const sectionIndex = sections.findIndex((section) => section.data.includes(species));

		if (sectionIndex < 0) {
			return;
		}

		listRef.current?.scrollToLocation({
			sectionIndex,
			itemIndex: sections[sectionIndex].data.indexOf(species),
			viewPosition: 0.5,
			animated: false,
		});
	};

	/** 스크롤 재시도 횟수 초기화 뒤 고른 종으로 스크롤 */
	const handleSheetOpened = () => {
		scrollRetriesRef.current = 0;

		setTimeout(scrollToSelected, SCROLL_DELAY_MS);
	};

	/** 스크롤할 항목이 아직 그려지지 않았을 때 정한 횟수까지 다시 스크롤 */
	const handleScrollToIndexFailed = () => {
		if (scrollRetriesRef.current < MAX_SCROLL_RETRIES) {
			scrollRetriesRef.current += 1;

			requestAnimationFrame(scrollToSelected);
		}
	};

	return (
		<ItemPicker
			item={{
				first,
				label: t('parrot.species'),
				value: isSpeciesId(species) ? t(`parrot.speciesNames.${species}`) : t('parrot.choose'),
				disabled,
			}}
			sheet={{
				title: t('parrot.speciesQuestion'),
				listLayout: true,
				onOpened: handleSheetOpened,
			}}
		>
			{(close) => (
				<BottomSheetSectionList
					ref={listRef}
					sections={sections}
					keyExtractor={(speciesId: SpeciesId) => speciesId}
					stickySectionHeadersEnabled
					initialNumToRender={sections.flatMap((section) => section.data).length}
					onScrollToIndexFailed={handleScrollToIndexFailed}
					contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
					renderSectionHeader={({ section }: { section: Section }) => (
						<View style={styles.header}>
							<Copy accessibilityRole="header" style={styles.headerText}>
								{t(`parrot.speciesGroups.${section.key}`)}
							</Copy>
						</View>
					)}
					renderItem={({ item: speciesId, index }: { item: SpeciesId; index: number }) => {
						/** 종 선택과 시트 닫기 */
						const handleSelectSpecies = () => {
							setSpecies(speciesId);

							close();
						};

						return (
							<ItemRadio
								first={index === 0}
								label={t(`parrot.speciesNames.${speciesId}`)}
								selected={species === speciesId}
								onPress={handleSelectSpecies}
							/>
						);
					}}
				/>
			)}
		</ItemPicker>
	);
};

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

export default SpeciesPicker;
