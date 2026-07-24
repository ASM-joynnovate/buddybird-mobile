import type { AppLocale } from '@/features/i18n/i18n-resources';
import { translations } from '@/features/i18n/i18n-resources';

export interface SpeciesOption {
  id: string;
  label: string;
}

export type SpeciesSize = 'small' | 'medium' | 'large';

export interface SpeciesGroup {
  size: SpeciesSize;
  label: string;
  options: SpeciesOption[];
}

// 종을 몸집(소/중/대)으로 묶어 배치한다. 그룹 순서·그룹 내 순서가 곧 칩 노출 순서.
const SPECIES_SIZE_GROUPS: readonly { size: SpeciesSize; ids: readonly string[] }[] = [
  { size: 'small', ids: ['budgie', 'cockatiel', 'lovebird', 'parrotlet'] },
  { size: 'medium', ids: ['conure', 'quaker', 'caique', 'ringneck', 'senegal', 'lory'] },
  { size: 'large', ids: ['african-grey', 'eclectus', 'amazon', 'cockatoo', 'macaw'] },
];

export const PRESET_SPECIES_IDS: readonly string[] = SPECIES_SIZE_GROUPS.flatMap((group) => group.ids);

export const CUSTOM_SPECIES_MAX_LENGTH = 50;

export function isPresetSpeciesId(value: string): boolean {
  return PRESET_SPECIES_IDS.includes(value);
}

export function getSpeciesGroups(locale: AppLocale): SpeciesGroup[] {
  const speciesCopy = translations[locale].profileOptions.speciesOptions;
  const sizeCopy = translations[locale].profileOptions.sizeLabels;
  return SPECIES_SIZE_GROUPS.map((group) => ({
    size: group.size,
    label: sizeCopy[group.size],
    options: group.ids.map((id) => ({ id, label: speciesCopy[id] ?? id })),
  }));
}

export function getSpeciesLabel(locale: AppLocale, species: string): string {
  const trimmed = species.trim();
  if (!trimmed) return '';
  return translations[locale].profileOptions.speciesOptions[trimmed] ?? trimmed;
}
