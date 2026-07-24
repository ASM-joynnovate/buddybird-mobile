import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/app-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingProfileForm } from '@/components/onboarding/onboarding-profile-form';
import { ProfileAvatarPicker } from '@/components/profile/profile-avatar-picker';
import { PillButton } from '@/components/ui/pill-button';
import { SpeechBubble } from '@/components/ui/speech-bubble';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { ProfileValidationErrors } from '@/features/profile/profile-types';

interface OnboardingProfileViewProps {
  birthDate: string | null;
  birthDateLabel: string;
  ctaLabel: string;
  customMode: boolean;
  errors: ProfileValidationErrors;
  intro: string;
  isSaving: boolean;
  name: string;
  nameLabel: string;
  namePlaceholder: string;
  onBirthDateChange: (birthDate: string | null) => void;
  onCustomMode: () => void;
  onCustomSpeciesChange: (species: string) => void;
  onNameChange: (name: string) => void;
  onPhotoSelected: (photoUri: string) => void;
  onSpeciesChange: (species: string) => void;
  onSubmit: () => void;
  photoUri?: string;
  saveError: string | null;
  species: string;
  speciesLabel: string;
  speciesPlaceholder: string;
}

export function OnboardingProfileView({
  birthDate,
  birthDateLabel,
  ctaLabel,
  customMode,
  errors,
  intro,
  isSaving,
  name,
  nameLabel,
  namePlaceholder,
  onBirthDateChange,
  onCustomMode,
  onCustomSpeciesChange,
  onNameChange,
  onPhotoSelected,
  onSpeciesChange,
  onSubmit,
  photoUri,
  saveError,
  species,
  speciesLabel,
  speciesPlaceholder,
}: OnboardingProfileViewProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top + Spacing.md }]}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Image
            accessibilityLabel={t('common.mascotA11y')}
            contentFit="cover"
            source={require('@/assets/images/icon.png')}
            style={styles.introIcon}
          />
          <SpeechBubble pointer="side-left" style={styles.introBubble}>{intro}</SpeechBubble>
        </View>
        <ProfileAvatarPicker actionIcon="plus" photoUri={photoUri} onPhotoSelected={onPhotoSelected} />
        <OnboardingProfileForm
          birthDate={birthDate}
          birthDateLabel={birthDateLabel}
          customMode={customMode}
          errors={errors}
          name={name}
          nameLabel={nameLabel}
          namePlaceholder={namePlaceholder}
          onBirthDateChange={onBirthDateChange}
          onCustomMode={onCustomMode}
          onCustomSpeciesChange={onCustomSpeciesChange}
          onNameChange={onNameChange}
          onSpeciesChange={onSpeciesChange}
          species={species}
          speciesLabel={speciesLabel}
          speciesPlaceholder={speciesPlaceholder}
        />
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
      </KeyboardAwareScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 34 }]}>
        <PillButton disabled={isSaving} full label={ctaLabel} onPress={onSubmit} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BuddyBirdColors.canvas,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.cardPaddingSm,
  },
  intro: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  introBubble: {
    flex: 1,
    marginBottom: Spacing.xxs,
  },
  introIcon: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  saveError: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.accentCoral,
  },
  footer: {
    borderColor: BuddyBirdColors.border,
    borderTopWidth: 2,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.cardPaddingSm,
  },
});
