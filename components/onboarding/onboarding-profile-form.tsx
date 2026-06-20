import Slider from '@react-native-community/slider';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';
import type { SpeciesOption } from '@/features/profile/profile-options';
import type { ProfileValidationErrors } from '@/features/profile/profile-types';

interface OnboardingProfileFormProps {
  ageLabel: string;
  ageMonths: number;
  customMode: boolean;
  customInputLabel: string;
  errors: ProfileValidationErrors;
  name: string;
  nameLabel: string;
  namePlaceholder: string;
  onAgeMonthsChange: (months: number) => void;
  onCustomMode: () => void;
  onNameChange: (name: string) => void;
  onSpeciesChange: (species: string) => void;
  species: string;
  speciesLabel: string;
  speciesOptions: SpeciesOption[];
  speciesPlaceholder: string;
}

export function OnboardingProfileForm({
  ageLabel,
  ageMonths,
  customMode,
  customInputLabel,
  errors,
  name,
  nameLabel,
  namePlaceholder,
  onAgeMonthsChange,
  onCustomMode,
  onNameChange,
  onSpeciesChange,
  species,
  speciesLabel,
  speciesOptions,
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
        <View style={styles.chips}>
          {speciesOptions.map((option) => (
            <Chip
              key={option.id}
              active={!customMode && species === option.id}
              label={option.label}
              onPress={() => onSpeciesChange(option.id)}
            />
          ))}
          <Chip active={customMode} label={customInputLabel} onPress={onCustomMode} tone="sun" />
        </View>
        {customMode ? (
          <TextInput
            autoCapitalize="none"
            onChangeText={onSpeciesChange}
            placeholder={speciesPlaceholder}
            placeholderTextColor={BuddyBirdColors.placeholderMuted}
            style={[styles.input, styles.customSpeciesInput]}
            value={species}
          />
        ) : null}
      </FormField>

      <FormField error={errors.ageMonths} label={ageLabel}>
        <Slider
          maximumTrackTintColor={BuddyBirdColors.border}
          maximumValue={1200}
          minimumTrackTintColor={BuddyBirdColors.primary}
          minimumValue={1}
          onValueChange={(months) => onAgeMonthsChange(Math.round(months))}
          step={1}
          thumbTintColor={BuddyBirdColors.primary}
          value={ageMonths}
        />
      </FormField>
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
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  customSpeciesInput: {
    marginTop: Spacing.sectionHeadGap,
  },
});
