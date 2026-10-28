import { type Locale, localeDefinitions } from '@/types/locale';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/i18n/en-US';
import { es } from '@/i18n/es-ES';
import { ja } from '@/i18n/ja-JP';
import { ko } from '@/i18n/ko-KR';
import { ru } from '@/i18n/ru-RU';
import { th } from '@/i18n/th-TH';
import { zhHans } from '@/i18n/zh-Hans';
import { zhHant } from '@/i18n/zh-Hant';

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/ru';
import 'dayjs/locale/th';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-tw';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isoWeek from 'dayjs/plugin/isoWeek';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat';
import utc from 'dayjs/plugin/utc';
import { josa } from 'es-hangul';
import 'intl-pluralrules';

dayjs.extend(buddhistEra);
dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isoWeek);
dayjs.extend(localizedFormat);
dayjs.extend(preParsePostFormat);
dayjs.extend(utc);

interface JosaFormatOptions {
	type: Parameters<typeof josa.pick>[1];
}

/** 앱 언어 변경 함수 */
export const changeI18nLocale = async (locale: Locale) => {
	dayjs.locale(localeDefinitions[locale].dateLocale);

	if (i18next.isInitialized) {
		await i18next.changeLanguage(locale);
	} else {
		await i18next.use(initReactI18next).init({
			lng: locale,
			fallbackLng: 'ko-KR',
			resources: {
				'ko-KR': { translation: ko },
				'en-US': { translation: en },
				'ja-JP': { translation: ja },
				'ru-RU': { translation: ru },
				'es-ES': { translation: es },
				'th-TH': { translation: th },
				'zh-Hans': { translation: zhHans },
				'zh-Hant': { translation: zhHant },
			},
			interpolation: { escapeValue: false },
			initAsync: false,
		});

		i18next.services.formatter?.add(
			'josa',
			(value: string, _lng: string | undefined, { type }: JosaFormatOptions) => josa.pick(value, type),
		);
	}
};

export default i18next;
