import { useState } from 'react';

import type { CountryItem } from '@/types/country';

import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { Flag } from '@/components/ui/flag';
import { ItemRadio } from '@/components/ui/item/radio';
import { SheetSearchList } from '@/components/ui/sheet/search-list';

interface Props {
	countryItems: readonly CountryItem[];
	country: string | null;
	onSelect: (country: string) => void;
}

/**
 * 국가 검색 목록 컴포넌트
 * @param countryItems 이름순으로 정렬한 국가 목록
 * @param country 선택한 국가 코드
 * @param onSelect 국가 선택 시 실행할 함수
 */
const CountryPickerList = ({ countryItems, country, onSelect }: Props) => {
	const { t } = useTranslation();

	const [query, setQuery] = useState('');

	const keyword = query.trim().toLowerCase();
	const filteredCountries = countryItems.filter((countryItem) =>
		countryItem.searchNames.some((searchName) => searchName.toLowerCase().includes(keyword)),
	);

	return (
		<SheetSearchList
			query={query}
			placeholder={t('settings.general.countrySearchHint')}
			clearLabel={t('settings.general.searchClear')}
			items={filteredCountries}
			emptyContent=<EmptyState message={t('settings.general.countryNotFound', { query: query.trim() })} />
			keyExtractor={(countryItem) => countryItem.code}
			renderItem={(countryItem, index) => (
				<ItemRadio
					isFirstInGroup={index === 0}
					leading=<Flag country={countryItem.code} />
					label={countryItem.name}
					highlight={keyword}
					selected={country === countryItem.code}
					onPress={() => onSelect(countryItem.code)}
				/>
			)}
			onChangeQuery={setQuery}
		/>
	);
};

export default CountryPickerList;
