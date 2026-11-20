import type { ReportGuideSample } from '@/types/guide/report';

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
	websiteLocale: string;
	reportGuideSample: ReportGuideSample;
}

export const defaultLocale: Locale = 'en-US';

export const localeDefinitions: Record<Locale, LocaleDefinition> = {
	'bn-BD': {
		nativeName: 'বাংলা',
		englishName: 'Bangla',
		dateLocale: 'bn-bd',
		countryNamesLocale: 'bn',
		websiteLocale: 'bn',
		reportGuideSample: 'hello',
	},
	'zh-Hans': {
		nativeName: '简体中文',
		englishName: 'Chinese (Simplified)',
		dateLocale: 'zh',
		countryNamesLocale: 'zh',
		websiteLocale: 'zh-cn',
		reportGuideSample: 'hello',
	},
	'zh-Hant': {
		nativeName: '繁體中文',
		englishName: 'Chinese (Traditional)',
		dateLocale: 'zh-tw',
		countryNamesLocale: 'zh-hant',
		websiteLocale: 'zh-tw',
		reportGuideSample: 'hello',
	},
	'en-US': {
		nativeName: 'English',
		englishName: 'English',
		dateLocale: 'en',
		countryNamesLocale: 'en',
		websiteLocale: 'en',
		reportGuideSample: 'hello',
	},
	'hi-IN': {
		nativeName: 'हिन्दी',
		englishName: 'Hindi',
		dateLocale: 'hi',
		countryNamesLocale: 'hi',
		websiteLocale: 'hi',
		reportGuideSample: 'hello',
	},
	'ja-JP': {
		nativeName: '日本語',
		englishName: 'Japanese',
		dateLocale: 'ja',
		countryNamesLocale: 'ja',
		websiteLocale: 'ja',
		reportGuideSample: 'hello',
	},
	'ko-KR': {
		nativeName: '한국어',
		englishName: 'Korean',
		dateLocale: 'ko',
		countryNamesLocale: 'ko',
		websiteLocale: 'ko',
		reportGuideSample: 'annyeong',
	},
	'ru-RU': {
		nativeName: 'Русский',
		englishName: 'Russian',
		dateLocale: 'ru',
		countryNamesLocale: 'ru',
		websiteLocale: 'ru',
		reportGuideSample: 'hello',
	},
	'es-ES': {
		nativeName: 'Español',
		englishName: 'Spanish',
		dateLocale: 'es',
		countryNamesLocale: 'es',
		websiteLocale: 'es',
		reportGuideSample: 'hello',
	},
	'th-TH': {
		nativeName: 'ไทย',
		englishName: 'Thai',
		dateLocale: 'th',
		countryNamesLocale: 'th',
		websiteLocale: 'th',
		reportGuideSample: 'hello',
	},
	'vi-VN': {
		nativeName: 'Tiếng Việt',
		englishName: 'Vietnamese',
		dateLocale: 'vi',
		countryNamesLocale: 'vi',
		websiteLocale: 'vi',
		reportGuideSample: 'hello',
	},
};
