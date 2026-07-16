import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetScreen } from '@/components/layout/pet-screen';
import { ProfileAchievementsGrid } from '@/components/profile/profile-achievements-grid';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
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

// 고정 "피드백 보내기" 버튼(lg)의 대략 높이 — 스크롤 콘텐츠가 이 버튼에 가리지 않도록 확보한다.
const FEEDBACK_FOOTER_HEIGHT = 58;

export default function ProfileScreen() {
  const { t } = useI18n();
  const { profile } = useProfile();
  const { store } = useTrainingData();
  const { openForm } = useFeedback();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <PetScreen
        contentStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.screenBottomTabs + FEEDBACK_FOOTER_HEIGHT + Spacing.md },
        ]}
      >
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

      {/* 탭바 바로 위에 고정되는 피드백 버튼 (스크롤 밖) */}
      <View style={[styles.feedbackFooter, { bottom: Spacing.screenBottomTabs }]}>
        <PillButton
          full
          icon="paperplane.fill"
          label={t('feedback.profileCta')}
          onPress={() => openForm('profile')}
          size="lg"
          variant="white"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: 22,
  },
  feedbackFooter: {
    position: 'absolute',
    left: Spacing.screenXLg,
    right: Spacing.screenXLg,
  },
});
