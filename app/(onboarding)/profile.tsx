import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { PillButton } from '@/components/ui/pill-button';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useOnboardingDraft } from '@/features/profile/onboarding-draft-context';
import { useProfile } from '@/features/profile/profile-context';
import { getSpeciesOptions, isPresetSpeciesId } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { createProfileFromDraft, validateProfileDraft } from '@/features/profile/profile-validation';

const YEAR_OPTIONS = Array.from({ length: 101 }, (_, i) => i);
const ALL_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i);
const NONZERO_MONTH_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function OnboardingProfileScreen() {
  const { locale, t } = useI18n();
  const { track, recordError } = useAnalytics();
  const { draft, setDraft } = useOnboardingDraft();
  const { saveProfile } = useProfile();

  const { elapsedMs } = useScreenTracking('onboarding_profile');
  const onboardingStartedAtRef = useRef(Date.now());

  const initialSpecies = draft.species ?? '';
  const initialCustomMode = initialSpecies !== '' && !isPresetSpeciesId(initialSpecies);

  const [name, setName] = useState(draft.name ?? '');
  const [species, setSpecies] = useState(initialSpecies);
  const [customMode, setCustomMode] = useState(initialCustomMode);
  const initialTotal = draft.ageMonths ?? 12;
  const [ageYears, setAgeYears] = useState(Math.floor(initialTotal / 12));
  const [localMonths, setLocalMonths] = useState(initialTotal % 12);
  const [photoUri, setPhotoUri] = useState(draft.photoUri);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const speciesOptions = useMemo(() => getSpeciesOptions(locale), [locale]);

  const monthOptions =
    ageYears === 0 ? NONZERO_MONTH_OPTIONS : ageYears === 100 ? [0] : ALL_MONTH_OPTIONS;

  function handleYearsChange(years: number) {
    setAgeYears(years);
    if (years === 0 && localMonths === 0) setLocalMonths(1);
    if (years === 100) setLocalMonths(0);
  }

  const profileDraft = useMemo<ProfileDraft>(
    () => ({
      ageMonths: ageYears * 12 + localMonths,
      name,
      photoUri,
      species,
    }),
    [ageYears, localMonths, name, photoUri, species]
  );

  async function submitProfileStep(): Promise<void> {
    const validation = validateProfileDraft(profileDraft, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setDraft(profileDraft);
    track({
      name: 'onboarding_step_completed',
      params: { step: 'profile', duration_ms: elapsedMs() },
    });

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
      recordError(error instanceof Error ? error : new Error(String(error)), { screen_name: 'onboarding_profile' });
      setSaveError(t('profile.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  function selectSpecies(nextSpecies: string): void {
    setSpecies(nextSpecies);
    setCustomMode(false);
    setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('onboarding.profile.kicker')}</Text>
        <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
      </View>

      <ProfileAvatarPicker photoUri={photoUri} onPhotoSelected={setPhotoUri} />

      <View style={styles.form}>
        <FormField error={errors.name} label={t('onboarding.profile.nameLabel')}>
          <TextInput
            autoCapitalize="none"
            onChangeText={(value) => {
              setName(value);
              setErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
            }}
            placeholder={t('onboarding.profile.namePlaceholder')}
            placeholderTextColor={BuddyBirdColors.placeholderMuted}
            style={styles.input}
            value={name}
          />
        </FormField>

        <FormField error={errors.species} label={t('onboarding.profile.speciesLabel')}>
          <View style={styles.chips}>
            {speciesOptions.map((option) => (
              <Chip key={option.id} active={!customMode && species === option.id} label={option.label} onPress={() => selectSpecies(option.id)} />
            ))}
            <Chip
              active={customMode}
              label={t('common.customInput')}
              onPress={() => {
                setCustomMode(true);
                setSpecies('');
              }}
              tone="sun"
            />
          </View>
          {customMode ? (
            <TextInput
              autoCapitalize="none"
              onChangeText={(value) => {
                setSpecies(value);
                setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
              }}
              placeholder={t('onboarding.profile.speciesPlaceholder')}
              placeholderTextColor={BuddyBirdColors.placeholderMuted}
              style={styles.input}
              value={species}
            />
          ) : null}
        </FormField>

        <FormField error={errors.ageMonths} label={t('onboarding.profile.ageLabel')}>
          <View style={styles.agePanel}>
            <View style={styles.agePickers}>
              <WheelPicker options={YEAR_OPTIONS} selected={ageYears} onChange={handleYearsChange} />
              <Text style={styles.ageUnit}>년</Text>
              <WheelPicker options={monthOptions} selected={localMonths} onChange={setLocalMonths} />
              <Text style={styles.ageUnit}>개월</Text>
            </View>
          </View>
        </FormField>
      </View>

      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

      <PillButton
        disabled={isSaving}
        full
        label={isSaving ? t('common.saving') : t('common.next')}
        onPress={submitProfileStep}
        size="lg"
      />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
    paddingBottom: Spacing.onboardingBottom,
  },
  header: {
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: BuddyBirdColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.primary,
  },
  body: {
    ...Typography.body,
    color: BuddyBirdColors.bodyMuted,
  },
  form: {
    gap: Spacing.sectionY,
  },
  input: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 1,
    color: BuddyBirdColors.primary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.chipGap,
  },
  agePanel: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.sectionCard,
    borderWidth: 1,
    gap: Spacing.cardPaddingSm,
    padding: Spacing.cardPaddingSm,
  },
  agePickers: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ageUnit: {
    color: BuddyBirdColors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  saveError: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.accentCoral,
  },
});
