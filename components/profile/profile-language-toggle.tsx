import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { InlineError } from '@/components/ui/inline-error';
import { BuddyBirdColors, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import type { AppLocale } from '@/features/i18n/i18n-resources';

export function ProfileLanguageToggle() {
  const { t, locale, supportedLocales, setLocale } = useI18n();
  const { track } = useAnalytics();
  const [saveFailed, setSaveFailed] = useState(false);

  async function handleSelect(next: AppLocale): Promise<void> {
    if (next === locale) return;
    try {
      await setLocale(next);
      setSaveFailed(false);
      track({ name: 'language_changed', params: { from: locale, to: next } });
    } catch (error: unknown) {
      reportError(error, { scope: 'i18n.setLocale' });
      setSaveFailed(true);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('profile.languageTitle')}</Text>
      <View style={styles.chipRow}>
        {supportedLocales.map((supportedLocale) => (
          <Chip
            key={supportedLocale}
            active={locale === supportedLocale}
            label={t(`common.languageNames.${supportedLocale}`)}
            onPress={() => void handleSelect(supportedLocale)}
          />
        ))}
      </View>
      <InlineError message={saveFailed ? t('profile.languageSaveError') : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  title: {
    ...Typography.section,
    color: BuddyBirdColors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
