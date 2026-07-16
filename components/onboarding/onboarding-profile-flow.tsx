import { useMemo, useRef, useState } from 'react';

import { OnboardingProfileView } from '@/components/onboarding/onboarding-profile-view';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useOnboardingDraft } from '@/features/profile/onboarding-draft-context';
import { useProfile } from '@/features/profile/profile-context';
import { getSpeciesOptions, isPresetSpeciesId } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { createProfileFromDraft, validateProfileDraft } from '@/features/profile/profile-validation';

interface OnboardingProfileFlowProps {
  onBack: () => void;
}

export function OnboardingProfileFlow({ onBack }: OnboardingProfileFlowProps) {
  const { locale, t } = useI18n();
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
  const initialTotal = draft.ageMonths ?? 12;
  const [ageMonths, setAgeMonths] = useState(Math.max(1, initialTotal));
  const [photoUri, setPhotoUri] = useState(draft.photoUri);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const speciesOptions = useMemo(() => getSpeciesOptions(locale), [locale]);
  const profileDraft = useMemo<ProfileDraft>(
    () => ({ ageMonths, name, photoUri, species }),
    [ageMonths, name, photoUri, species]
  );

  function handleNameChange(nextName: string): void {
    setName(nextName);
    setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
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

  function enableCustomMode(): void {
    setCustomMode(true);
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
          parrot_age_months: profile.ageMonths,
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
      ageLabel={t('onboarding.profile.ageLabel', {
        months: ageMonths % 12,
        years: Math.floor(ageMonths / 12),
      })}
      ageMonths={ageMonths}
      ctaLabel={isSaving ? t('common.saving') : t('common.start')}
      customMode={customMode}
      customInputLabel={t('common.customInput')}
      errors={errors}
      intro={t('onboarding.profile.intro')}
      isSaving={isSaving}
      name={name}
      nameLabel={t('onboarding.profile.nameLabel')}
      namePlaceholder={t('onboarding.profile.namePlaceholder')}
      onAgeMonthsChange={setAgeMonths}
      onBack={onBack}
      onCustomMode={enableCustomMode}
      onCustomSpeciesChange={changeCustomSpecies}
      onNameChange={handleNameChange}
      onPhotoSelected={setPhotoUri}
      onSpeciesChange={selectSpecies}
      onSubmit={() => void submitProfileStep()}
      photoUri={photoUri}
      saveError={saveError}
      species={species}
      speciesLabel={t('onboarding.profile.speciesLabel')}
      speciesOptions={speciesOptions}
      speciesPlaceholder={t('onboarding.profile.speciesPlaceholder')}
    />
  );
}
