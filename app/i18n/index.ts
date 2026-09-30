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
import { josa } from 'es-hangul';
import 'intl-pluralrules';

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

const dayjsLocales: Record<Locale, string> = { 'ko-KR': 'ko', 'en-US': 'en' };

/** 앱 언어 변경 함수 */
export const changeI18nLocale = async (locale: Locale) => {
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

		i18next.services.formatter?.add(
			'josa',
			(value: string, _lng: string | undefined, { type }: { type: Parameters<typeof josa.pick>[1] }) =>
				josa.pick(value, type),
		);
	}
};

export default i18next;
