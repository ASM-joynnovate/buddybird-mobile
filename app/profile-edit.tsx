import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileEditForm } from '@/components/profile/forms/profile-edit-form';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { toDraft } from '@/features/profile/profile-display';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { validateProfileDraft } from '@/features/profile/profile-validation';

export default function ProfileEditScreen() {
  const { t } = useI18n();
  const { profile, updateProfile } = useProfile();
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft | null>(profile ? toDraft(profile) : null);
  const [isSaving, setIsSaving] = useState(false);
  // 2연타 가드 — disabled(isSaving) 는 다음 렌더에 반영돼 같은 tick 재탭을 놓친다 (BB-300).
  // 성공 시 router.back() 으로 화면이 pop 되므로 실패(재시도) 경로에서만 푼다.
  const savingRef = useRef(false);

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
      birthDate: nextForm.birthDate === undefined ? currentErrors.birthDate : undefined,
      name: nextForm.name === undefined ? currentErrors.name : undefined,
      species: nextForm.species === undefined ? currentErrors.species : undefined,
    }));
  }

  async function saveEdit(): Promise<void> {
    if (savingRef.current) return;

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

    savingRef.current = true;
    setIsSaving(true);

    try {
      await updateProfile({
        ...currentProfile,
        ...currentForm,
        species: speciesTrimmed,
      });
      router.back();
    } catch (error: unknown) {
      savingRef.current = false;
      setIsSaving(false);
      reportError(error, { scope: 'profile.saveEdit', screen_name: 'profile_edit' });
      setSaveErrorMessage(t('profile.saveError'));
    }
  }

  return (
    <PetScreen avoidKeyboard bottomTabBar={false} contentStyle={styles.content}>
      <ProfileEditForm
        form={form}
        errors={errors}
        isSaving={isSaving}
        saveErrorMessage={saveErrorMessage}
        t={t}
        onPatch={patchForm}
        onCancel={() => router.back()}
        onSave={saveEdit}
      />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingHorizontal: 22,
  },
});
