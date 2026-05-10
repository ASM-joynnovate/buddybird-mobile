import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { useOnboardingDraft } from '@/features/profile/onboarding-draft-context';
import { getSpeciesOptions } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors, SpeciesId } from '@/features/profile/profile-types';
import { formatAgeMonths, validateProfileDraft } from '@/features/profile/profile-validation';

export default function OnboardingProfileScreen() {
  const { locale, t } = useI18n();
  const speciesOptions = useMemo(() => getSpeciesOptions(locale), [locale]);
  const { draft, setDraft } = useOnboardingDraft();
  const [name, setName] = useState(draft.name ?? '');
  const [species, setSpecies] = useState<SpeciesId | 'custom' | ''>(draft.species ?? '');
  const [customSpecies, setCustomSpecies] = useState(draft.customSpecies ?? '');
  const [customMode, setCustomMode] = useState(draft.species === 'custom');
  const [ageMonths, setAgeMonths] = useState(draft.ageMonths ?? 12);
  const [photoUri, setPhotoUri] = useState(draft.photoUri);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});

  const profileDraft = useMemo<ProfileDraft>(
    () => ({
      ageMonths,
      customSpecies,
      name,
      photoUri,
      species: customMode ? 'custom' : species,
      trainingGoalIds: draft.trainingGoalIds ?? ['greet'],
    }),
    [ageMonths, customMode, customSpecies, draft.trainingGoalIds, name, photoUri, species]
  );

  function submitProfileStep(): void {
    const validation = validateProfileDraft(profileDraft, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setDraft(profileDraft);
    router.push('./goals');
  }

  function selectSpecies(nextSpecies: SpeciesId): void {
    setSpecies(nextSpecies);
    setCustomMode(false);
    setCustomSpecies('');
    setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('onboarding.profile.kicker')}</Text>
        <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
        <Text style={styles.body}>{t('onboarding.profile.body')}</Text>
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
            placeholderTextColor="rgba(31,58,61,0.36)"
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
                setSpecies('custom');
              }}
              tone="sun"
            />
          </View>
          {customMode ? (
            <TextInput
              autoCapitalize="none"
              onChangeText={(value) => {
                setCustomSpecies(value);
                setErrors((currentErrors) => ({ ...currentErrors, species: undefined }));
              }}
              placeholder={t('onboarding.profile.speciesPlaceholder')}
              placeholderTextColor="rgba(31,58,61,0.36)"
              style={styles.input}
              value={customSpecies}
            />
          ) : null}
        </FormField>

        <FormField error={errors.ageMonths} label={t('onboarding.profile.ageLabel')}>
          <View style={styles.agePanel}>
            <Text style={styles.ageLabel}>{formatAgeMonths(ageMonths, t)}</Text>
            <View style={styles.ageButtons}>
              <PillButton
                disabled={ageMonths <= 1}
                label={t('onboarding.profile.minusMonth')}
                onPress={() => setAgeMonths((currentAge) => Math.max(1, currentAge - 1))}
                variant="ghost"
              />
              <PillButton
                disabled={ageMonths >= 120}
                label={t('onboarding.profile.plusMonth')}
                onPress={() => setAgeMonths((currentAge) => Math.min(120, currentAge + 1))}
                variant="ghost"
              />
            </View>
          </View>
        </FormField>
      </View>

      <PillButton full label={t('common.next')} onPress={submitProfileStep} size="lg" />
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
    color: PetHubColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
  },
  form: {
    gap: Spacing.sectionY,
  },
  input: {
    backgroundColor: PetHubColors.surface,
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 1,
    color: PetHubColors.primary,
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
    backgroundColor: PetHubColors.surface,
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.sectionCard,
    borderWidth: 1,
    gap: Spacing.cardPaddingSm,
    padding: Spacing.cardPaddingSm,
  },
  ageLabel: {
    ...Typography.cardTitle,
    color: PetHubColors.primary,
  },
  ageButtons: {
    flexDirection: 'row',
    gap: Spacing.chipGap,
  },
});
