import type { AppLocale } from '@/features/i18n/i18n-resources';
import { translations } from '@/features/i18n/i18n-resources';

export interface SpeciesOption {
  id: string;
  label: string;
}

export const PRESET_SPECIES_IDS: readonly string[] = [
  'african-grey',
  'cockatoo',
  'budgie',
  'parakeet',
  'lovebird',
  'conure',
];

export function isPresetSpeciesId(value: string): boolean {
  return PRESET_SPECIES_IDS.includes(value);
}

export function getSpeciesOptions(locale: AppLocale): SpeciesOption[] {
  const speciesCopy = translations[locale].profileOptions.speciesOptions;
  return PRESET_SPECIES_IDS.map((id) => ({ id, label: speciesCopy[id] ?? id }));
}

export function getSpeciesLabel(locale: AppLocale, species: string): string {
  const trimmed = species.trim();
  if (!trimmed) return '';
  return translations[locale].profileOptions.speciesOptions[trimmed] ?? trimmed;
}
