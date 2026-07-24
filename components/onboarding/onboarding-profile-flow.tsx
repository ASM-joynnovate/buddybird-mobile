import { useMemo, useRef, useState } from 'react';

import { OnboardingProfileView } from '@/components/onboarding/onboarding-profile-view';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useOnboardingDraft } from '@/features/profile/onboarding-draft-context';
import { useProfile } from '@/features/profile/profile-context';
import { ageMonthsFromBirthDate, birthDateFromAgeMonths } from '@/features/profile/profile-age';
import { isPresetSpeciesId } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { createProfileFromDraft, validateProfileDraft } from '@/features/profile/profile-validation';

// 온보딩 기본 생년월일: 약 1살(12개월 전 그 달 1일).
const DEFAULT_AGE_MONTHS = 12;

export function OnboardingProfileFlow() {
  const { t } = useI18n();
  const { track, recordError } = useAnalytics();
  const { draft, setDraft } = useOnboardingDraft();
  const { saveProfile } = useProfile();
  const { elapsedMs } = useScreenTracking('onboarding_profile');
  const onboardingStartedAtRef = useRef<number>(null!);
  if (onboardingStartedAtRef.current === null) {
    onboardingStartedAtRef.current = Date.now();
  }
  const initialSpecies = draft.species ?? '';
  const initialCustomMode = initialSpecies !== '' && !isPresetSpeciesId(initialSpecies);

  const [name, setName] = useState(draft.name ?? '');
  const [species, setSpecies] = useState(initialSpecies);
  const [customMode, setCustomMode] = useState(initialCustomMode);
  const [birthDate, setBirthDate] = useState<string | null>(() =>
    // undefined(미입력)면 기본값, null(모름)·string이면 draft 값을 유지한다.
    draft.birthDate !== undefined
      ? draft.birthDate
      : birthDateFromAgeMonths(new Date().toISOString(), DEFAULT_AGE_MONTHS)
  );
  const [photoUri, setPhotoUri] = useState(draft.photoUri);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const profileDraft = useMemo<ProfileDraft>(
    () => ({ birthDate, name, photoUri, species }),
    [birthDate, name, photoUri, species]
  );

  function handleNameChange(nextName: string): void {
    setName(nextName);
    setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
  }

  function handleBirthDateChange(nextBirthDate: string | null): void {
    setBirthDate(nextBirthDate);
    setErrors((currentErrors) => ({ ...currentErrors, birthDate: undefined }));
  }

  function selectSpecies(nextSpecies: string): void {
    setSpecies(nextSpecies);
    setCustomMode(false);
    setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
  }

  function changeCustomSpecies(nextSpecies: string): void {
    setSpecies(nextSpecies);
    setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
  }

  function toggleCustomMode(): void {
    // 다시 누르면 해제 — 어느 방향이든 선택된 종은 비운다.
    setCustomMode((prev) => !prev);
    setSpecies('');
  }

  async function submitProfileStep(): Promise<void> {
    const validation = validateProfileDraft(profileDraft, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setDraft(profileDraft);
    track({ name: 'onboarding_step_completed', params: { step: 'profile', duration_ms: elapsedMs() } });
    setIsSaving(true);

    try {
      const nowIso = new Date().toISOString();
      const profile = createProfileFromDraft(profileDraft, nowIso);
      await saveProfile(profile);
      track({
        name: 'profile_created',
        params: {
          parrot_name: profile.name,
          parrot_species: profile.species,
          parrot_age_months: ageMonthsFromBirthDate(profile.birthDate) ?? undefined,
        },
      });
      track({
        name: 'onboarding_completed',
        params: { total_duration_ms: Date.now() - onboardingStartedAtRef.current },
      });
    } catch (error: unknown) {
      void recordError(error instanceof Error ? error : new Error(String(error)), {
        screen_name: 'onboarding_profile',
      });
      setSaveError(t('profile.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OnboardingProfileView
      birthDate={birthDate}
      birthDateLabel={t('common.birthDate.label')}
      ctaLabel={isSaving ? t('common.saving') : t('common.start')}
      customMode={customMode}
      errors={errors}
      intro={t('onboarding.profile.intro')}
      isSaving={isSaving}
      name={name}
      nameLabel={t('onboarding.profile.nameLabel')}
      namePlaceholder={t('onboarding.profile.namePlaceholder')}
      onBirthDateChange={handleBirthDateChange}
      onCustomMode={toggleCustomMode}
      onCustomSpeciesChange={changeCustomSpecies}
      onNameChange={handleNameChange}
      onPhotoSelected={setPhotoUri}
      onSpeciesChange={selectSpecies}
      onSubmit={() => void submitProfileStep()}
      photoUri={photoUri}
      saveError={saveError}
      species={species}
      speciesLabel={t('onboarding.profile.speciesLabel')}
      speciesPlaceholder={t('onboarding.profile.speciesPlaceholder')}
    />
  );
}
