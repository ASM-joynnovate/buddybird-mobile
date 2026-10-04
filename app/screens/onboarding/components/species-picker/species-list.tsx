import { type RefObject, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BottomSheetFlatList, type BottomSheetFlatListMethods, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font } from '@/theme';
import type { SpeciesGroup, SpeciesId } from '@/utils/species';

import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { ItemRadio } from '@/components/ui/item/radio';
import { TextButton } from '@/components/ui/text-button';

type SpeciesFilter = 'all' | SpeciesGroup;

const SPECIES_FILTERS: readonly SpeciesFilter[] = ['all', 'small', 'medium', 'large'];

export interface SpeciesItem {
	id: SpeciesId;
	group: SpeciesGroup;
	name: string;
}

interface Props {
	items: readonly SpeciesItem[];
	species: string;
	listRef: RefObject<BottomSheetFlatListMethods | null>;
	onSelect: (speciesId: SpeciesId) => void;
	onScrollToIndexFailed: () => void;
}

/**
 * 종 검색 목록 컴포넌트
 * @param items 이름순으로 정렬한 종 목록
 * @param species 선택한 종 ID
 * @param listRef 선택한 종으로 스크롤할 때 쓰는 ref
 * @param onSelect 종 선택 시 실행할 함수
 * @param onScrollToIndexFailed 선택한 종으로 스크롤하지 못했을 때 실행할 함수
 */
const SpeciesList = ({ items, species, listRef, onSelect, onScrollToIndexFailed }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState<SpeciesFilter>('all');

	const keyword = query.trim().toLowerCase();
	const filteredItems = items.filter(
		(item) => (filter === 'all' || item.group === filter) && item.name.toLowerCase().includes(keyword),
	);
	const emptyMessage =
		filter === 'all'
			? t('parrot.speciesNotFound', { query: query.trim() })
			: t('parrot.speciesNotFoundInGroup', { group: t(`parrot.speciesGroups.${filter}`), query: query.trim() });

	const handleClearQuery = () => {
		setQuery('');
	};

	const handleSearchAll = () => {
		setFilter('all');
	};

	return (
		<View style={styles.container}>
			<View style={styles.controlsContainer}>
				<View>
					<SearchIcon size={20} color={colors.muted} style={styles.searchIcon} />
					<BottomSheetTextInput
						value={query}
						onChangeText={setQuery}
						accessibilityLabel={t('parrot.speciesSearchHint')}
						placeholder={t('parrot.speciesSearchHint')}
						placeholderTextColor={colors.muted}
						allowFontScaling={false}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="search"
						style={styles.searchInput}
					/>
					{!!query && (
						<View style={styles.clearButtonContainer}>
							<IconButton
								icon={CircleXIcon}
								iconProps={{ color: colors.onFilled, fill: colors.subtle }}
								label={t('parrot.speciesSearchClear')}
								variant="muted"
								size="small"
								onPress={handleClearQuery}
							/>
						</View>
					)}
				</View>

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
			</View>

			<BottomSheetFlatList
				ref={listRef}
				data={filteredItems}
				keyExtractor={(item: SpeciesItem) => item.id}
				initialNumToRender={items.length}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				onScrollToIndexFailed={onScrollToIndexFailed}
				contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
				renderItem={({ item, index }: { item: SpeciesItem; index: number }) => (
					<ItemRadio
						first={index === 0}
						label={item.name}
						value={filter === 'all' ? t(`parrot.speciesGroups.${item.group}`) : undefined}
						highlight={keyword}
						selected={species === item.id}
						onPress={() => onSelect(item.id)}
					/>
				)}
				ListEmptyComponent={
					<View>
						<EmptyState message={emptyMessage} />
						{filter !== 'all' && (
							<View style={styles.searchAllContainer}>
								<TextButton label={t('parrot.searchAllSpecies')} onPress={handleSearchAll} />
							</View>
						)}
					</View>
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	controlsContainer: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8, gap: 12 },
	searchIcon: { position: 'absolute', left: 14, top: 15, zIndex: 1 },
	searchInput: {
		minHeight: 50,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 14,
		paddingLeft: 44,
		paddingRight: 44,
		paddingVertical: 10,
		fontFamily: font.bold,
		fontSize: 16,
		color: colors.text,
	},
	clearButtonContainer: { position: 'absolute', right: 3, top: 3 },
	filtersRow: { flexDirection: 'row', gap: 8 },
	filter: { flex: 1 },
	list: { paddingHorizontal: 10 },
	searchAllContainer: { alignItems: 'flex-end' },
});

export default SpeciesList;
