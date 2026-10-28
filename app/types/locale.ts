export const locales = [
	'ko-KR',
	'en-US',
	'ja-JP',
	'ru-RU',
	'es-ES',
	'th-TH',
	'zh-Hans',
	'zh-Hant',
	'vi-VN',
	'hi-IN',
	'bn-BD',
] as const;

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
	'th-TH': { nativeName: 'ไทย', dateLocale: 'th', countryNamesLocale: 'th' },
	'zh-Hans': { nativeName: '简体中文', dateLocale: 'zh', countryNamesLocale: 'zh' },
	'zh-Hant': { nativeName: '繁體中文', dateLocale: 'zh-tw', countryNamesLocale: 'zh-tw' },
	'vi-VN': { nativeName: 'Tiếng Việt', dateLocale: 'vi', countryNamesLocale: 'vi' },
	'hi-IN': { nativeName: 'हिन्दी', dateLocale: 'hi', countryNamesLocale: 'hi' },
	'bn-BD': { nativeName: 'বাংলা', dateLocale: 'bn-bd', countryNamesLocale: 'bn' },
};
