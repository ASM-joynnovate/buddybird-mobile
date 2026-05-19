import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { ProfileEditForm } from '@/components/profile/forms/profile-edit-form';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { toDraft } from '@/features/profile/profile-display';
import { getSpeciesOptions } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { validateProfileDraft } from '@/features/profile/profile-validation';

export default function ProfileScreen() {
  const { locale, t } = useI18n();
  const speciesOptions = useMemo(() => getSpeciesOptions(locale), [locale]);
  const { profile, updateProfile } = useProfile();
  useScreenTracking('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft | null>(profile ? toDraft(profile) : null);

  useEffect(() => {
    if (profile && !isEditing) {
      setForm(toDraft(profile));
    }
  }, [isEditing, profile]);

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
      species: nextForm.species === undefined ? currentErrors.species : undefined,
    }));
  }

  async function saveEdit(): Promise<void> {
    const validation = validateProfileDraft(currentForm, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const speciesTrimmed = currentForm.species.trim();

    if (!speciesTrimmed) {
      setErrors({ species: t('validation.speciesRequired') });
      return;
    }

    try {
      await updateProfile({
        ...currentProfile,
        ...currentForm,
        species: speciesTrimmed,
      });
      setErrors({});
      setSaveErrorMessage(null);
      setIsEditing(false);
    } catch (error: unknown) {
      reportError(error, { scope: 'profile.saveEdit', screen_name: 'profile' });
      setSaveErrorMessage(t('profile.saveError'));
    }
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <ScreenHeader kicker={t('profile.kicker')} title={t('profile.title')} />

      <ParrotProfileCard compact profile={profile} />

      {isEditing ? (
        <ProfileEditForm
          form={form}
          errors={errors}
          saveErrorMessage={saveErrorMessage}
          speciesOptions={speciesOptions}
          t={t}
          onPatch={patchForm}
          onCancel={() => {
            setErrors({});
            setSaveErrorMessage(null);
            setIsEditing(false);
          }}
          onSave={saveEdit}
        />
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
        <Text style={styles.futureTitle}>{t('profile.futureTitle')}</Text>
        <Text style={styles.bodySmall}>{t('profile.futureBody')}</Text>
      </View>
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
  },
  futureBox: {
    backgroundColor: BuddyBirdColors.feather,
    borderRadius: Radii.sectionCard,
    gap: Spacing.micro,
    padding: Spacing.cardPaddingSm,
  },
  futureTitle: {
    ...Typography.body,
    color: BuddyBirdColors.primary,
    fontWeight: '700',
  },
});
