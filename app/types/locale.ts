export const locales = [
	'bn-BD',
	'zh-Hans',
	'zh-Hant',
	'en-US',
	'hi-IN',
	'ja-JP',
	'ko-KR',
	'ru-RU',
	'es-ES',
	'th-TH',
	'vi-VN',
] as const;

export type Locale = (typeof locales)[number];

interface LocaleDefinition {
	nativeName: string;
	englishName: string;
	dateLocale: string;
	countryNamesLocale: string;
}

export const defaultLocale: Locale = 'en-US';

export const localeDefinitions: Record<Locale, LocaleDefinition> = {
	'bn-BD': { nativeName: 'বাংলা', englishName: 'Bangla', dateLocale: 'bn-bd', countryNamesLocale: 'bn' },
	'zh-Hans': {
		nativeName: '简体中文',
		englishName: 'Chinese (Simplified)',
		dateLocale: 'zh',
		countryNamesLocale: 'zh',
	},
	'zh-Hant': {
		nativeName: '繁體中文',
		englishName: 'Chinese (Traditional)',
		dateLocale: 'zh-tw',
		countryNamesLocale: 'zh-hant',
	},
	'en-US': { nativeName: 'English', englishName: 'English', dateLocale: 'en', countryNamesLocale: 'en' },
	'hi-IN': { nativeName: 'हिन्दी', englishName: 'Hindi', dateLocale: 'hi', countryNamesLocale: 'hi' },
	'ja-JP': { nativeName: '日本語', englishName: 'Japanese', dateLocale: 'ja', countryNamesLocale: 'ja' },
	'ko-KR': { nativeName: '한국어', englishName: 'Korean', dateLocale: 'ko', countryNamesLocale: 'ko' },
	'ru-RU': { nativeName: 'Русский', englishName: 'Russian', dateLocale: 'ru', countryNamesLocale: 'ru' },
	'es-ES': { nativeName: 'Español', englishName: 'Spanish', dateLocale: 'es', countryNamesLocale: 'es' },
	'th-TH': { nativeName: 'ไทย', englishName: 'Thai', dateLocale: 'th', countryNamesLocale: 'th' },
	'vi-VN': { nativeName: 'Tiếng Việt', englishName: 'Vietnamese', dateLocale: 'vi', countryNamesLocale: 'vi' },
};
