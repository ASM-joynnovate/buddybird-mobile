import AsyncStorage from '@react-native-async-storage/async-storage';

import { type AppLocale, isSupportedLocale } from './i18n-resources';

const LOCALE_STORAGE_KEY = '@pethub/locale';

export async function loadStoredLocale(): Promise<AppLocale | null> {
  const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale && isSupportedLocale(storedLocale) ? storedLocale : null;
}

export async function saveStoredLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
