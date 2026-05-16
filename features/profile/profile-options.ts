import type { AppLocale } from '@/features/i18n/i18n-resources';
import { translations } from '@/features/i18n/i18n-resources';

import type { MaterialIconName, TrainingGoal, TrainingGoalId } from './profile-types';

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

const TRAINING_GOAL_IDS: TrainingGoalId[] = ['greet', 'fruit', 'name', 'leave', 'song'];

const TRAINING_GOAL_ICONS: Record<TrainingGoalId, MaterialIconName> = {
  fruit: 'restaurant',
  greet: 'wb-sunny',
  leave: 'meeting-room',
  name: 'favorite',
  song: 'volume-up',
};

export const DEFAULT_GOAL_IDS = ['greet', 'fruit'] as const;

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

export function getTrainingGoals(locale: AppLocale): TrainingGoal[] {
  const goalCopy = translations[locale].profileOptions.trainingGoals;

  return TRAINING_GOAL_IDS.map((id) => ({
    id,
    icon: TRAINING_GOAL_ICONS[id],
    label: goalCopy[id].label,
    sample: goalCopy[id].sample,
  }));
}
