import type { AppLocale } from './i18n-resources';
import { translations } from './i18n-resources';

export type PresetWordTemplate = (typeof translations)[AppLocale]['trainingTemplates']['presetWords'][number];
export type SessionTemplate = (typeof translations)[AppLocale]['trainingTemplates']['sessions'][number];

export function getPresetWordTemplates(locale: AppLocale): PresetWordTemplate[] {
  return translations[locale].trainingTemplates.presetWords.map((word) => ({ ...word }));
}

export function getSessionTemplates(locale: AppLocale): SessionTemplate[] {
  return translations[locale].trainingTemplates.sessions.map((session) => ({ ...session }));
}
