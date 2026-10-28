export const locales = ['ko-KR', 'en-US', 'ja-JP', 'ru-RU', 'es-ES'] as const;

export type Locale = (typeof locales)[number];

export interface LocaleDefinition {
	name: string;
	dateLocale: string;
	countryLocale: string;
}

export const defaultLocale: Locale = 'en-US';

export const localeDefinitions: Record<Locale, LocaleDefinition> = {
	'ko-KR': { name: '한국어', dateLocale: 'ko', countryLocale: 'ko' },
	'en-US': { name: 'English', dateLocale: 'en', countryLocale: 'en' },
	'ja-JP': { name: '日本語', dateLocale: 'ja', countryLocale: 'ja' },
	'ru-RU': { name: 'Русский', dateLocale: 'ru', countryLocale: 'ru' },
	'es-ES': { name: 'Español', dateLocale: 'es', countryLocale: 'es' },
};
