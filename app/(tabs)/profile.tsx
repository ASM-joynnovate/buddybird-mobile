import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { type AppLocale } from '@/features/i18n/i18n-resources';
import { useProfile } from '@/features/profile/profile-context';
import { getSpeciesOptions } from '@/features/profile/profile-options';
import type { ParrotProfile, ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { validateProfileDraft } from '@/features/profile/profile-validation';

export default function ProfileScreen() {
  const { locale, setLocale, supportedLocales, t } = useI18n();
  const speciesOptions = useMemo(() => getSpeciesOptions(locale), [locale]);
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [languageErrorMessage, setLanguageErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft | null>(profile ? toDraft(profile) : null);

  useEffect(() => {
    if (profile && !isEditing) {
      setForm(toDraft(profile));
    }
  }, [isEditing, profile]);

  const isCustomSpecies = form?.species === 'custom';

  if (!profile || !form) {
    return null;
  }

  const currentProfile = profile;
  const currentForm = form;

  function patchForm(nextForm: Partial<ProfileDraft>): void {
    setForm((currentForm) => (currentForm ? { ...currentForm, ...nextForm } : currentForm));
    setSaveErrorMessage(null);
    setErrors((currentErrors) => ({
      ...currentErrors,
      ageMonths: nextForm.ageMonths === undefined ? currentErrors.ageMonths : undefined,
      name: nextForm.name === undefined ? currentErrors.name : undefined,
      species:
        nextForm.species === undefined && nextForm.customSpecies === undefined ? currentErrors.species : undefined,
      trainingGoalIds:
        nextForm.trainingGoalIds === undefined ? currentErrors.trainingGoalIds : undefined,
    }));
  }

  async function saveEdit(): Promise<void> {
    const validation = validateProfileDraft(currentForm, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!currentForm.species) {
      setErrors({ species: t('validation.speciesRequired') });
      return;
    }

    try {
      await updateProfile({
        ...currentProfile,
        ...currentForm,
        customSpecies: currentForm.species === 'custom' ? currentForm.customSpecies?.trim() : undefined,
        species: currentForm.species,
        trainingGoalIds: [...currentForm.trainingGoalIds],
      });
      setErrors({});
      setSaveErrorMessage(null);
      setIsEditing(false);
    } catch {
      setSaveErrorMessage(t('profile.saveError'));
    }
  }

  async function changeLocale(nextLocale: AppLocale): Promise<void> {
    try {
      await setLocale(nextLocale);
      setLanguageErrorMessage(null);
    } catch {
      setLanguageErrorMessage(t('profile.languageSaveError'));
    }
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('profile.kicker')}</Text>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.body}>{t('profile.body')}</Text>
      </View>

      <ParrotProfileCard compact profile={profile} />

      {isEditing ? (
        <View style={styles.form}>
          <ProfileAvatarPicker photoUri={form.photoUri} onPhotoSelected={(photoUri) => patchForm({ photoUri })} />
          <FormField error={errors.name} label={t('profile.nameLabel')}>
            <TextInput
              onChangeText={(name) => patchForm({ name })}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor="rgba(31,58,61,0.36)"
              style={styles.input}
              value={form.name}
            />
          </FormField>
          <FormField error={errors.species} label={t('profile.speciesLabel')}>
            <View style={styles.chips}>
              {speciesOptions.map((option) => (
                <Chip key={option.id} active={form.species === option.id} label={option.label} onPress={() => patchForm({ customSpecies: '', species: option.id })} />
              ))}
              <Chip active={isCustomSpecies} label={t('common.directInput')} onPress={() => patchForm({ species: 'custom' })} tone="sun" />
            </View>
            {isCustomSpecies || !form.species ? (
              <TextInput
                onChangeText={(customSpecies) => patchForm({ customSpecies })}
                placeholder={t('profile.speciesPlaceholder')}
                placeholderTextColor="rgba(31,58,61,0.36)"
                style={styles.input}
                value={form.customSpecies}
              />
            ) : null}
          </FormField>
          {saveErrorMessage ? <Text style={styles.error}>{saveErrorMessage}</Text> : null}
          <View style={styles.actions}>
            <PillButton
              label={t('common.cancel')}
              onPress={() => {
                setErrors({});
                setSaveErrorMessage(null);
                setIsEditing(false);
              }}
              variant="ghost"
            />
            <PillButton label={t('common.save')} onPress={saveEdit} variant="primary" />
          </View>
        </View>
      ) : (
        <PillButton
          full
          label={t('profile.editCta')}
          onPress={() => {
            setErrors({});
            setSaveErrorMessage(null);
            setIsEditing(true);
          }}
          variant="primary"
        />
      )}

      <View style={styles.futureBox}>
        <Text style={styles.futureTitle}>{t('profile.languageTitle')}</Text>
        <Text style={styles.bodySmall}>{t('profile.languageBody')}</Text>
        <View style={styles.chips}>
          {supportedLocales.map((supportedLocale) => (
            <Chip
              key={supportedLocale}
              active={locale === supportedLocale}
              label={t(`common.languageNames.${supportedLocale}`)}
              onPress={() => changeLocale(supportedLocale)}
              tone="sun"
            />
          ))}
        </View>
        {languageErrorMessage ? <Text style={styles.error}>{languageErrorMessage}</Text> : null}
      </View>

      <View style={styles.futureBox}>
        <Text style={styles.futureTitle}>{t('profile.futureTitle')}</Text>
        <Text style={styles.bodySmall}>{t('profile.futureBody')}</Text>
      </View>
    </PetScreen>
  );
}

function toDraft(profile: ParrotProfile): ProfileDraft {
  return {
    ageMonths: profile.ageMonths,
    name: profile.name,
    photoUri: profile.photoUri,
    customSpecies: profile.customSpecies,
    species: profile.species,
    trainingGoalIds: [...profile.trainingGoalIds],
  };
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
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
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sectionHeadGap,
  },
  error: {
    ...Typography.bodySmall,
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
  futureBox: {
    backgroundColor: PetHubColors.feather,
    borderRadius: Radii.sectionCard,
    gap: Spacing.micro,
    padding: Spacing.cardPaddingSm,
  },
  futureTitle: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
});
