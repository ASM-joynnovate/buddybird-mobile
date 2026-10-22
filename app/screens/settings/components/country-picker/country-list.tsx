import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { Flag } from '@/components/ui/flag';
import { ItemRadio } from '@/components/ui/item/radio';
import { SheetSearchField } from '@/components/ui/sheet/search-field';

export interface CountryItem {
	code: string;
	name: string;
	searchNames: string[];
}

interface Props {
	items: readonly CountryItem[];
	country: string | null;
	onSelect: (country: string) => void;
}

/**
 * 국가 검색 목록 컴포넌트
 * @param items 이름순으로 정렬한 국가 목록
 * @param country 선택한 국가 코드
 * @param onSelect 국가 선택 시 실행할 함수
 */
const CountryList = ({ items, country, onSelect }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const [query, setQuery] = useState('');

	const keyword = query.trim().toLowerCase();
	const filteredItems = items.filter((item) =>
		item.searchNames.some((searchName) => searchName.toLowerCase().includes(keyword)),
	);

	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<SheetSearchField
					value={query}
					placeholder={t('settings.general.countrySearchHint')}
					clearLabel={t('settings.general.countrySearchClear')}
					onChangeText={setQuery}
				/>
			</View>

			<BottomSheetFlatList
				data={filteredItems}
				keyExtractor={(item: CountryItem) => item.code}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
				renderItem={({ item, index }: { item: CountryItem; index: number }) => (
					<ItemRadio
						first={index === 0}
						leading=<Flag country={item.code} />
						label={item.name}
						highlight={keyword}
						selected={country === item.code}
						onPress={() => onSelect(item.code)}
					/>
				)}
				ListEmptyComponent=<EmptyState
					message={t('settings.general.countryNotFound', { query: query.trim() })}
				/>
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	searchContainer: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
	list: { paddingHorizontal: 10 },
});

export default CountryList;
