import type { I18n } from 'i18n-js';

import type { ParrotProfile, ProfileDraft, ProfileValidationErrors, ProfileValidationResult } from './profile-types';

const MAX_AGE_MONTHS = 120;

type Translate = I18n['t'];

export function validateProfileDraft(draft: ProfileDraft, t: Translate): ProfileValidationResult {
  const errors: ProfileValidationErrors = {};

  if (!draft.name.trim()) {
    errors.name = t('validation.nameRequired');
  }

  if (!draft.species || (draft.species === 'custom' && !draft.customSpecies?.trim())) {
    errors.species = t('validation.speciesRequired');
  }

  if (!Number.isInteger(draft.ageMonths) || draft.ageMonths < 1 || draft.ageMonths > MAX_AGE_MONTHS) {
    errors.ageMonths = t('validation.ageInvalid');
  }

  if (draft.trainingGoalIds.length === 0) {
    errors.trainingGoalIds = t('validation.goalRequired');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatAgeMonths(ageMonths: number, t: Translate): string {
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (years === 0) {
    return t('common.age.months', { months });
  }

  if (months === 0) {
    return t('common.age.years', { years });
  }

  return t('common.age.yearsMonths', { months, years });
}

export function createProfileFromDraft(draft: ProfileDraft, nowIso: string): ParrotProfile {
  if (!draft.species) {
    throw new Error('Profile species is required');
  }

  return {
    id: `parrot-${nowIso}`,
    name: draft.name.trim(),
    species: draft.species === 'custom' ? 'custom' : draft.species,
    customSpecies: draft.species === 'custom' ? draft.customSpecies?.trim() : undefined,
    ageMonths: draft.ageMonths,
    photoUri: draft.photoUri,
    trainingGoalIds: [...draft.trainingGoalIds],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
