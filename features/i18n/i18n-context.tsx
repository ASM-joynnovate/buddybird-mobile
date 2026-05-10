import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { loadStoredLocale, saveStoredLocale } from './i18n-storage';
import { DEFAULT_LOCALE, normalizeLocale, type AppLocale, SUPPORTED_LOCALES, translations } from './i18n-resources';

const deviceLocale = normalizeLocale(getLocales()[0]?.languageTag ?? getLocales()[0]?.languageCode);

interface I18nContextValue {
  locale: AppLocale;
  supportedLocales: readonly AppLocale[];
  t: I18n['t'];
  setLocale: (locale: AppLocale) => Promise<void>;
}

interface I18nProviderProps {
  children: ReactNode;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(deviceLocale);

  useEffect(() => {
    let isMounted = true;

    loadStoredLocale()
      .then((storedLocale) => {
        if (isMounted && storedLocale) {
          setLocaleState(storedLocale);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLocaleState(deviceLocale);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const i18n = useMemo(
    () =>
      new I18n(translations, {
        defaultLocale: DEFAULT_LOCALE,
        enableFallback: true,
        locale,
        missingBehavior: 'message',
      }),
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: async (nextLocale: AppLocale) => {
        await saveStoredLocale(nextLocale);
        setLocaleState(nextLocale);
      },
      supportedLocales: SUPPORTED_LOCALES,
      t: i18n.t.bind(i18n),
    }),
    [i18n, locale]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const contextValue = useContext(I18nContext);

  if (!contextValue) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return contextValue;
}
