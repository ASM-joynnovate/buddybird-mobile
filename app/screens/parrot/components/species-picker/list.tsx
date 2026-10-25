import { type RefObject, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';

import type { SpeciesGroup, SpeciesId } from '@/utils/species';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ItemRadio } from '@/components/ui/item/radio';
import { SheetSearchList } from '@/components/ui/sheet/search-list';
import { TextButton } from '@/components/ui/text-button';

type SpeciesFilter = 'all' | SpeciesGroup;

const SPECIES_FILTERS: readonly SpeciesFilter[] = ['all', 'small', 'medium', 'large'];

export interface SpeciesItem {
	id: SpeciesId;
	group: SpeciesGroup;
	name: string;
}

interface Props {
	speciesItems: readonly SpeciesItem[];
	species: string;
	listRef: RefObject<BottomSheetFlatListMethods | null>;
	onSelect: (speciesId: SpeciesId) => void;
	onScrollToIndexFailed: () => void;
}

/**
 * 종 검색 목록 컴포넌트
 * @param speciesItems 이름순으로 정렬한 종 목록
 * @param species 선택한 종 ID
 * @param listRef 선택한 종으로 스크롤할 때 쓰는 ref
 * @param onSelect 종 선택 시 실행할 함수
 * @param onScrollToIndexFailed 선택한 종으로 스크롤하지 못했을 때 실행할 함수
 */
const SpeciesPickerList = ({ speciesItems, species, listRef, onSelect, onScrollToIndexFailed }: Props) => {
	const { t } = useTranslation();

	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState<SpeciesFilter>('all');

	const keyword = query.trim().toLowerCase();
	const filteredSpecies = speciesItems.filter(
		(speciesItem) =>
			(filter === 'all' || speciesItem.group === filter) && speciesItem.name.toLowerCase().includes(keyword),
	);
	const emptyMessage =
		filter === 'all'
			? t('parrot.speciesNotFound', { query: query.trim() })
			: t('parrot.speciesNotFoundInGroup', { group: t(`parrot.speciesGroups.${filter}`), query: query.trim() });

	return (
		<SheetSearchList
			query={query}
			placeholder={t('parrot.speciesSearchHint')}
			clearLabel={t('parrot.speciesSearchClear')}
			filters={
				<View style={styles.filtersRow}>
					{SPECIES_FILTERS.map((speciesFilter) => (
						<Chip
							key={speciesFilter}
							label={
								speciesFilter === 'all'
									? t('parrot.speciesAll')
									: t(`parrot.speciesGroups.${speciesFilter}`)
							}
							selected={filter === speciesFilter}
							onPress={() => setFilter(speciesFilter)}
							style={styles.filter}
						/>
					))}
				</View>
			}
			items={filteredSpecies}
			listRef={listRef}
			initialNumToRender={speciesItems.length}
			emptyContent={
				<View>
					<EmptyState message={emptyMessage} />
					{filter !== 'all' && (
						<View style={styles.searchAllContainer}>
							<TextButton label={t('parrot.searchAllSpecies')} onPress={() => setFilter('all')} />
						</View>
					)}
				</View>
			}
			keyExtractor={(speciesItem) => speciesItem.id}
			renderItem={(speciesItem, index) => (
				<ItemRadio
					isFirstInGroup={index === 0}
					label={speciesItem.name}
					value={filter === 'all' ? t(`parrot.speciesGroups.${speciesItem.group}`) : undefined}
					highlight={keyword}
					selected={species === speciesItem.id}
					onPress={() => onSelect(speciesItem.id)}
				/>
			)}
			onChangeQuery={setQuery}
			onScrollToIndexFailed={onScrollToIndexFailed}
		/>
	);
};

const styles = StyleSheet.create({
	filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	filter: { flexGrow: 1 },
	searchAllContainer: { alignItems: 'flex-end' },
});

export default SpeciesPickerList;
