import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';

export default function OnboardingWelcomeScreen() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { elapsedMs } = useScreenTracking('onboarding_welcome');

  function proceed(): void {
    track({
      name: 'onboarding_step_completed',
      params: { step: 'welcome', duration_ms: elapsedMs() },
    });
    router.push('./profile');
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.parrotCircle}>
          <Text style={styles.parrot}>🦜</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{t('onboarding.welcome.kicker')}</Text>
          <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.body}>{t('onboarding.welcome.body')}</Text>
        </View>
      </View>
      <PillButton full label={t('onboarding.welcome.cta')} onPress={proceed} size="lg" />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.onboardingHeroGap,
    justifyContent: 'space-between',
    minHeight: '100%',
    paddingBottom: Spacing.onboardingBottom,
    paddingTop: 52,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.onboardingHeroGap,
  },
  parrotCircle: {
    alignItems: 'center',
    backgroundColor: PetHubColors.feather,
    borderColor: PetHubColors.featherDeep,
    borderRadius: Radii.full,
    borderWidth: 1,
    height: 164,
    justifyContent: 'center',
    shadowColor: PetHubColors.tertiary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    width: 164,
  },
  parrot: {
    fontSize: 78,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: PetHubColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    ...Typography.onboardingTitle,
    color: PetHubColors.primary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
    maxWidth: 310,
    textAlign: 'center',
  },
});
