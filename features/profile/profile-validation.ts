import type { I18n } from 'i18n-js';

import type { ParrotProfile, ProfileDraft, ProfileValidationErrors, ProfileValidationResult } from './profile-types';

type Translate = I18n['t'];

export function validateProfileDraft(draft: ProfileDraft, t: Translate): ProfileValidationResult {
  const errors: ProfileValidationErrors = {};

  if (!draft.name.trim()) {
    errors.name = t('validation.nameRequired');
  }

  if (!draft.species.trim()) {
    errors.species = t('validation.speciesRequired');
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
  const species = draft.species.trim();

  if (!species) {
    throw new Error('Profile species is required');
  }

  return {
    id: `parrot-${nowIso}`,
    name: draft.name.trim(),
    species,
    ageMonths: draft.ageMonths,
    photoUri: draft.photoUri,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
