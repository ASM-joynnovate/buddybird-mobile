import { StyleSheet, View } from 'react-native';
import { TextInput } from '@/components/ui/app-text';

import { BirthDateField } from '@/components/profile/birthdate-field';
import { SpeciesChips } from '@/components/profile/species-chips';
import { FormField } from '@/components/ui/form-field';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import { CUSTOM_SPECIES_MAX_LENGTH } from '@/features/profile/profile-options';
import type { ProfileValidationErrors } from '@/features/profile/profile-types';

interface OnboardingProfileFormProps {
  birthDate: string | null;
  birthDateLabel: string;
  customMode: boolean;
  errors: ProfileValidationErrors;
  name: string;
  nameLabel: string;
  namePlaceholder: string;
  onBirthDateChange: (birthDate: string | null) => void;
  onCustomMode: () => void;
  onCustomSpeciesChange: (species: string) => void;
  onNameChange: (name: string) => void;
  onSpeciesChange: (species: string) => void;
  species: string;
  speciesLabel: string;
  speciesPlaceholder: string;
}

export function OnboardingProfileForm({
  birthDate,
  birthDateLabel,
  customMode,
  errors,
  name,
  nameLabel,
  namePlaceholder,
  onBirthDateChange,
  onCustomMode,
  onCustomSpeciesChange,
  onNameChange,
  onSpeciesChange,
  species,
  speciesLabel,
  speciesPlaceholder,
}: OnboardingProfileFormProps) {
  return (
    <View style={styles.form}>
      <FormField error={errors.name} label={nameLabel}>
        <TextInput
          autoCapitalize="none"
          onChangeText={onNameChange}
          placeholder={namePlaceholder}
          placeholderTextColor={BuddyBirdColors.placeholderMuted}
          style={styles.input}
          value={name}
        />
      </FormField>

      <FormField error={errors.species} label={speciesLabel}>
        <SpeciesChips
          selectedId={species}
          customActive={customMode}
          onSelectPreset={onSpeciesChange}
          onCustom={onCustomMode}
        />
        {customMode ? (
          <TextInput
            autoCapitalize="none"
            maxLength={CUSTOM_SPECIES_MAX_LENGTH}
            onChangeText={onCustomSpeciesChange}
            placeholder={speciesPlaceholder}
            placeholderTextColor={BuddyBirdColors.placeholderMuted}
            style={[styles.input, styles.customSpeciesInput]}
            value={species}
          />
        ) : null}
      </FormField>

      <BirthDateField
        label={birthDateLabel}
        error={errors.birthDate}
        value={birthDate}
        onChange={onBirthDateChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.sectionY,
  },
  input: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 2,
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  customSpeciesInput: {
    marginTop: Spacing.sectionHeadGap,
  },
});
