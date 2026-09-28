import type { Locale } from '@/types/locale';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/i18n/en-US';
import { ko } from '@/i18n/ko-KR';

import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'intl-pluralrules';

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

const dayjsLocales: Record<Locale, string> = { 'ko-KR': 'ko', 'en-US': 'en' };

export async function changeI18nLocale(locale: Locale) {
	dayjs.locale(dayjsLocales[locale]);

	if (i18next.isInitialized) {
		await i18next.changeLanguage(locale);
	} else {
		await i18next.use(initReactI18next).init({
			lng: locale,
			fallbackLng: 'ko-KR',
			resources: {
				'ko-KR': { translation: ko },
				'en-US': { translation: en },
			},
			interpolation: { escapeValue: false },
			initImmediate: false,
		});
	}
}

export default i18next;
