export const locales = ["ko-KR", "en-US"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en-US"
