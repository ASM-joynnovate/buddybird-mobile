import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueSessionCard } from '@/components/home/continue-session-card';
import { HomeGreeting } from '@/components/home/home-greeting';
import { HomeStatsGrid } from '@/components/home/home-stats-grid';
import { ParrotSummaryCard } from '@/components/home/parrot-summary-card';
import { PetHubColors, Spacing, Typography } from '@/constants/theme';
import { formatMinutes } from '@/features/profile/profile-display';
import { useProfile } from '@/features/profile/profile-context';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds } from '@/features/training/training-model';

const LAST_SESSION = { words: ['사과', '안녕', '망고야'], cycles: 20, mins: 30 };
const WORDS_COUNT = 8;

export default function HomeScreen() {
  const { profile } = useProfile();
  const { store } = useTrainingData();
  const insets = useSafeAreaInsets();
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!profile) return null;

  const stat = formatMinutes(totalTrainingSeconds);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: Spacing.screenBottomTabs }]}
      showsVerticalScrollIndicator={false}
    >
      <HomeGreeting profileName={profile.name} />
      <ParrotSummaryCard profile={profile} />
      <ContinueSessionCard
        words={LAST_SESSION.words}
        totalWordsCount={WORDS_COUNT}
        cycles={LAST_SESSION.cycles}
        mins={LAST_SESSION.mins}
        onContinue={() => router.push('/session-setup')}
      />

      <View style={styles.wordsSectionRow}>
        <View>
          <Text style={styles.sectionKicker}>현재 학습 중</Text>
          <Text style={styles.sectionTitle}>단어 {WORDS_COUNT}개</Text>
        </View>
        <Pressable onPress={() => router.push('/words')}>
          <Text style={styles.sectionAction}>관리</Text>
        </Pressable>
      </View>

      <HomeStatsGrid
        todayStatValue={stat.value}
        todayStatUnit={stat.unit}
        weekStatValue={stat.value}
        weekStatUnit={stat.unit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  content: {
    gap: Spacing.sectionY,
    paddingHorizontal: Spacing.screenX,
  },
  wordsSectionRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionKicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
    fontSize: 22,
  },
  sectionAction: {
    color: PetHubColors.secondaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
});
