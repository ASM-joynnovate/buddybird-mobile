export const locales = ['ko-KR', 'en-US', 'ja-JP', 'ru-RU', 'es-ES'] as const;

export type Locale = (typeof locales)[number];

interface LocaleDefinition {
	nativeName: string;
	dateLocale: string;
	countryNamesLocale: string;
}

export const defaultLocale: Locale = 'en-US';

export const localeDefinitions: Record<Locale, LocaleDefinition> = {
	'ko-KR': { nativeName: '한국어', dateLocale: 'ko', countryNamesLocale: 'ko' },
	'en-US': { nativeName: 'English', dateLocale: 'en', countryNamesLocale: 'en' },
	'ja-JP': { nativeName: '日本語', dateLocale: 'ja', countryNamesLocale: 'ja' },
	'ru-RU': { nativeName: 'Русский', dateLocale: 'ru', countryNamesLocale: 'ru' },
	'es-ES': { nativeName: 'Español', dateLocale: 'es', countryNamesLocale: 'es' },
};
