import { type Locale, localeDefinitions } from '@/types/locale';

import zhHant from '@/i18n/zh-Hant/countries.json';

import nativeNames from 'countries-list/minimal/countries.native.min.json';
import { getNames, registerLocale } from 'i18n-iso-countries';
import bn from 'i18n-iso-countries/langs/bn.json';
import en from 'i18n-iso-countries/langs/en.json';
import es from 'i18n-iso-countries/langs/es.json';
import hi from 'i18n-iso-countries/langs/hi.json';
import ja from 'i18n-iso-countries/langs/ja.json';
import ko from 'i18n-iso-countries/langs/ko.json';
import ru from 'i18n-iso-countries/langs/ru.json';
import th from 'i18n-iso-countries/langs/th.json';
import vi from 'i18n-iso-countries/langs/vi.json';
import zh from 'i18n-iso-countries/langs/zh.json';

// 앱에서 사용하는 언어만 등록
registerLocale(ko);
registerLocale(en);
registerLocale(ja);
registerLocale(ru);
registerLocale(es);
registerLocale(th);
registerLocale(zh);
registerLocale({ locale: 'zh-hant', countries: zhHant });
registerLocale(vi);
registerLocale(hi);
registerLocale(bn);

/** 앱 언어로 된 국가 코드별 이름 조회 함수 */
export const countryNamesIn = (locale: Locale) => getNames(localeDefinitions[locale].countryNamesLocale);

export const countryNativeNames: Record<string, string> = nativeNames;

/** 국가 코드별 영어 이름 목록 */
export const countryEnglishNames = getNames('en', { select: 'all' });
