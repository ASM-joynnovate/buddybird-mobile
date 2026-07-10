import Slider from '@react-native-community/slider';
import type { I18n } from 'i18n-js';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/app-text';

import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { isPresetSpeciesId, type SpeciesOption } from '@/features/profile/profile-options';
import type { ProfileDraft, ProfileValidationErrors } from '@/features/profile/profile-types';
import { formatAgeMonths } from '@/features/profile/profile-validation';

interface ProfileEditFormProps {
  form: ProfileDraft;
  errors: ProfileValidationErrors;
  saveErrorMessage: string | null;
  speciesOptions: SpeciesOption[];
  t: I18n['t'];
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
    <View style={styles.root}>
      <View style={styles.backHeader}>
        <Pressable accessibilityLabel="프로필 화면으로 돌아가기" accessibilityRole="button" onPress={onCancel} style={styles.backButton}>
          <IconSymbol color={BuddyBirdColors.inkMuted} name="chevron.left" size={26} />
        </Pressable>
        <Text style={styles.kicker}>프로필 편집</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>프로필 편집</Text>
        <Text style={styles.subtitle}>우리 아이의 정보를 수정해요.</Text>
      </View>

      <View style={styles.form}>
        <ProfileAvatarPicker photoUri={form.photoUri} onPhotoSelected={(photoUri) => onPatch({ photoUri })} />
        <FormField error={errors.name} label={t('profile.nameLabel')}>
          <TextInput
            autoCapitalize="none"
            onChangeText={(name) => onPatch({ name })}
            placeholder={t('profile.namePlaceholder')}
            placeholderTextColor={BuddyBirdColors.placeholderMuted}
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
              label={t('common.customInput')}
              onPress={enterCustomMode}
            />
          </View>
          {isCustomMode ? (
            <TextInput
              autoCapitalize="none"
              onChangeText={(species) => onPatch({ species })}
              placeholder={t('profile.speciesPlaceholder')}
              placeholderTextColor={BuddyBirdColors.placeholderMuted}
              style={styles.input}
              value={form.species}
            />
          ) : null}
        </FormField>
        <FormField error={errors.ageMonths} label={`나이 · ${formatAgeMonths(form.ageMonths, t)}`}>
          <Slider
            maximumTrackTintColor={BuddyBirdColors.border}
            maximumValue={1200}
            minimumTrackTintColor={BuddyBirdColors.primary}
            minimumValue={1}
            onValueChange={(ageMonths) => onPatch({ ageMonths: Math.round(ageMonths) })}
            step={1}
            thumbTintColor={BuddyBirdColors.primary}
            value={form.ageMonths}
          />
        </FormField>
        <InlineError message={saveErrorMessage} />
      </View>

      <View style={styles.saveBar}>
        <PillButton full icon="checkmark" label={t('common.save')} onPress={onSave} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 18,
  },
  backHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  kicker: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    ...Typography.title,
    color: BuddyBirdColors.ink,
  },
  subtitle: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.border,
    borderRadius: Radii.field,
    borderWidth: 2,
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    height: 50,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.chipGap,
  },
  saveBar: {
    borderColor: BuddyBirdColors.border,
    borderTopWidth: 2,
    paddingBottom: 10,
    paddingTop: 14,
  },
});
