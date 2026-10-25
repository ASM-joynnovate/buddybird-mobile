export const locales = ['ko-KR', 'en-US', 'ja-JP', 'ru-RU', 'es-ES'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-US';

export const localeLanguages: Record<Locale, string> = {
	'ko-KR': 'ko',
	'en-US': 'en',
	'ja-JP': 'ja',
	'ru-RU': 'ru',
	'es-ES': 'es',
};
