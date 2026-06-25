import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAchievementsGrid } from '@/components/profile/profile-achievements-grid';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
import { ProfileStatsRow } from '@/components/profile/profile-stats-row';
import { PillButton } from '@/components/ui/pill-button';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { formatDurationMins, formatDurationSecs } from '@/features/shared/duration-format';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds, selectTrainingRewardSummary } from '@/features/training/training-model';

export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile } = useProfile();
  const { store } = useTrainingData();
  useScreenTracking('profile');
  const rewardSummary = store ? selectTrainingRewardSummary(store) : null;
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!profile) {
    return null;
  }

  const streakDays = rewardSummary?.currentStreakDays ?? 0;
  const todayLearningLabel = formatLearningTime(rewardSummary?.todayLearningSeconds ?? 0);
  const totalLearningLabel = formatLearningTime(totalTrainingSeconds);
  const totalLearningStatLabel = formatCompactLearningTime(totalTrainingSeconds);

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
      <PillButton
        full
        icon="person.fill"
        label={t('profile.editCta')}
        onPress={() => router.push('/profile-edit')}
        size="lg"
        variant="white"
      />
    </PetScreen>
  );
}

function formatLearningTime(seconds: number): string {
  return formatDurationSecs(seconds);
}

function formatCompactLearningTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}시간`;
  if (minutes < 1) return formatDurationSecs(seconds);
  return formatDurationMins(minutes);
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
  },
});
