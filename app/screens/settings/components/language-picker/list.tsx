import { useState } from 'react';

import { type Locale, locales } from '@/types/locale';

import { useTranslation } from 'react-i18next';

import { formatLanguageName } from '@/i18n/format';

import { EmptyState } from '@/components/ui/empty-state';
import { ItemRadio } from '@/components/ui/item/radio';
import { SheetSearchList } from '@/components/ui/sheet/search-list';

interface Props {
	locale: Locale;
	onSelect: (locale: Locale) => void;
}

/**
 * 언어 검색 목록 컴포넌트
 * @param locale 선택한 앱 언어
 * @param onSelect 언어 선택 시 실행할 함수
 */
const LanguagePickerList = ({ locale, onSelect }: Props) => {
	const { t } = useTranslation();

	const [query, setQuery] = useState('');

	const keyword = query.trim().toLowerCase();
	const filteredLocales = locales.filter((language) => formatLanguageName(language).toLowerCase().includes(keyword));

	return (
		<SheetSearchList
			query={query}
			placeholder={t('settings.general.languageSearchHint')}
			clearLabel={t('settings.general.searchClear')}
			items={filteredLocales}
			emptyContent=<EmptyState message={t('settings.general.languageNotFound', { query: query.trim() })} />
			keyExtractor={(language) => language}
			renderItem={(language, index) => (
				<ItemRadio
					isFirstInGroup={index === 0}
					label={formatLanguageName(language)}
					highlight={keyword}
					selected={locale === language}
					onPress={() => onSelect(language)}
				/>
			)}
			onChangeQuery={setQuery}
		/>
	);
};

export default LanguagePickerList;
