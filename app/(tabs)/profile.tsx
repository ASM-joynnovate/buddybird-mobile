import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAchievementsGrid } from '@/components/profile/profile-achievements-grid';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
import { ProfileLanguageToggle } from '@/components/profile/profile-language-toggle';
import { ProfileStatsRow } from '@/components/profile/profile-stats-row';
import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useFeedback } from '@/features/feedback/feedback-context';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { formatDurationCompact, formatDurationSecs } from '@/features/shared/duration-format';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds, selectTrainingRewardSummary } from '@/features/training/training-model';

export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile } = useProfile();
  const { store } = useTrainingData();
  const { openForm } = useFeedback();
  useScreenTracking('profile');
  const rewardSummary = store ? selectTrainingRewardSummary(store) : null;
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!profile) {
    return null;
  }

  const streakDays = rewardSummary?.currentStreakDays ?? 0;
  const todayLearningLabel = formatDurationSecs(rewardSummary?.todayLearningSeconds ?? 0, t);
  const totalLearningLabel = formatDurationSecs(totalTrainingSeconds, t);
  const totalLearningStatLabel = formatDurationCompact(totalTrainingSeconds, t);

  return (
    <PetScreen contentStyle={styles.content}>
      <ParrotProfileCard profile={profile} />
      <ProfileStatsRow
        streakDays={streakDays}
        todayLearningLabel={todayLearningLabel}
        totalLearningLabel={totalLearningStatLabel}
      />
      <ProfileAchievementsGrid
        streakDays={streakDays}
        todayLearningLabel={todayLearningLabel}
        todayLearningSeconds={rewardSummary?.todayLearningSeconds ?? 0}
        totalLearningLabel={totalLearningLabel}
        totalLearningSeconds={totalTrainingSeconds}
      />
      <ProfileLanguageToggle />
      <View style={styles.ctaRow}>
        <PillButton
          label={t('profile.editCta')}
          onPress={() => router.push('/profile-edit')}
          size="lg"
          style={styles.ctaButton}
          variant="white"
        />
        <PillButton
          label={t('feedback.profileCta')}
          onPress={() => openForm('profile')}
          size="lg"
          style={styles.ctaButton}
          variant="white"
        />
      </View>
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctaButton: {
    flex: 1,
  },
});
