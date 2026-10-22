export const locales = ['ko-KR', 'en-US', 'ja-JP', 'ru-RU', 'es-ES', 'th-TH'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-US';
