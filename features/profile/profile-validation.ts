import type { I18n } from 'i18n-js';

import { toLocalDateKey } from '@/features/shared/date-utils';

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

  // birthDate가 null이면 '모름'으로 유효. 값이 있을 때만 미래 날짜를 방어한다.
  // YYYY-MM-DD 문자열의 사전식 비교는 로컬 날짜 기준 시간순 비교와 같다.
  if (draft.birthDate !== null && draft.birthDate > toLocalDateKey(new Date())) {
    errors.birthDate = t('validation.birthDateFuture');
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
    birthDate: draft.birthDate,
    photoUri: draft.photoUri,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
