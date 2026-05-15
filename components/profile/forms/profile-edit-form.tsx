import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import { isPresetSpeciesId, type SpeciesOption } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';

interface ProfileEditFormProps {
  form: ProfileDraft;
  errors: ProfileValidationErrors;
  saveErrorMessage: string | null;
  speciesOptions: SpeciesOption[];
  t: (key: string) => string;
  onPatch: (patch: Partial<ProfileDraft>) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileEditForm({
  form,
  errors,
  saveErrorMessage,
  speciesOptions,
  t,
  onPatch,
  onCancel,
  onSave,
}: ProfileEditFormProps) {
  const [isCustomMode, setIsCustomMode] = useState(form.species !== '' && !isPresetSpeciesId(form.species));

  function selectPreset(speciesId: string): void {
    setIsCustomMode(false);
    onPatch({ species: speciesId });
  }

  function enterCustomMode(): void {
    setIsCustomMode(true);
    onPatch({ species: '' });
  }

  return (
    <View style={styles.form}>
      <ProfileAvatarPicker photoUri={form.photoUri} onPhotoSelected={(photoUri) => onPatch({ photoUri })} />
      <FormField error={errors.name} label={t('profile.nameLabel')}>
        <TextInput
          onChangeText={(name) => onPatch({ name })}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor="rgba(31,58,61,0.36)"
          style={styles.input}
          value={form.name}
        />
      </FormField>
      <FormField error={errors.species} label={t('profile.speciesLabel')}>
        <View style={styles.chips}>
          {speciesOptions.map((option) => (
            <Chip
              key={option.id}
              active={!isCustomMode && form.species === option.id}
              label={option.label}
              onPress={() => selectPreset(option.id)}
            />
          ))}
          <Chip
            active={isCustomMode}
            label={t('common.directInput')}
            onPress={enterCustomMode}
            tone="sun"
          />
        </View>
        {isCustomMode ? (
          <TextInput
            onChangeText={(species) => onPatch({ species })}
            placeholder={t('profile.speciesPlaceholder')}
            placeholderTextColor="rgba(31,58,61,0.36)"
            style={styles.input}
            value={form.species}
          />
        ) : null}
      </FormField>
      <InlineError message={saveErrorMessage} />
      <View style={styles.actions}>
        <PillButton label={t('common.cancel')} onPress={onCancel} variant="ghost" />
        <PillButton label={t('common.save')} onPress={onSave} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
