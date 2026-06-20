import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { InlineError } from '@/components/ui/inline-error';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import type { AppLocale } from '@/features/i18n/i18n-resources';

interface ProfileLanguagePickerProps {
  locale: AppLocale;
  supportedLocales: readonly AppLocale[];
  errorMessage: string | null;
  title: string;
  body: string;
  getLanguageLabel: (locale: AppLocale) => string;
  onChange: (next: AppLocale) => void;
}

export function ProfileLanguagePicker({
  locale,
  supportedLocales,
  errorMessage,
  title,
  body,
  getLanguageLabel,
  onChange,
}: ProfileLanguagePickerProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.bodySmall}>{body}</Text>
      <View style={styles.chips}>
        {supportedLocales.map((supportedLocale) => (
          <Chip
            key={supportedLocale}
            active={locale === supportedLocale}
            label={getLanguageLabel(supportedLocale)}
            onPress={() => onChange(supportedLocale)}
            tone="sun"
          />
        ))}
      </View>
      <InlineError message={errorMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: BuddyBirdColors.yellowTint,
    borderColor: BuddyBirdColors.accentYellow,
    borderRadius: Radii.sectionCard,
    borderWidth: 2,
    gap: Spacing.micro,
    padding: Spacing.cardPaddingSm,
  },
  title: {
    ...Typography.body,
    color: BuddyBirdColors.ink,
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkSoft,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.chipGap,
  },
});
