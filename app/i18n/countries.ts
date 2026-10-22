import type { Locale } from '@/types/locale';

import nativeNames from 'countries-list/minimal/countries.native.min.json';
import { getNames, registerLocale } from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import es from 'i18n-iso-countries/langs/es.json';
import ja from 'i18n-iso-countries/langs/ja.json';
import ko from 'i18n-iso-countries/langs/ko.json';
import ru from 'i18n-iso-countries/langs/ru.json';

// 앱에서 사용하는 언어만 등록
registerLocale(ko);
registerLocale(en);
registerLocale(ja);
registerLocale(ru);
registerLocale(es);

const countryLanguages: Record<Locale, string> = {
	'ko-KR': 'ko',
	'en-US': 'en',
	'ja-JP': 'ja',
	'ru-RU': 'ru',
	'es-ES': 'es',
};

/** 앱 언어로 된 국가 코드별 이름 조회 함수 */
export const countryNames = (locale: Locale) => getNames(countryLanguages[locale]);

/** 국가 코드별 현지 이름 */
export const countryNativeNames: Record<string, string> = nativeNames;

/** 국가 코드별 영어 이름 목록 */
export const countryEnglishNames = getNames('en', { select: 'all' });
