import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueSessionCard } from '@/components/home/continue-session-card';
import { HomeGreeting } from '@/components/home/home-greeting';
import { HomeStatsGrid } from '@/components/home/home-stats-grid';
import { ParrotSummaryCard } from '@/components/home/parrot-summary-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useProfile } from '@/features/profile/profile-context';
import { formatMinutes } from '@/features/profile/profile-display';
import { diffDaysIso } from '@/features/shared/date-utils';
import { createSessionId } from '@/features/shared/ids';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds } from '@/features/training/training-model';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import { resolvePresetAudioModule } from '@/features/word-library/word-library-preset-audio';

export default function HomeScreen() {
  const { profile } = useProfile();
  const { store, setPendingSession } = useTrainingData();
  const { entries } = useWordLibrary();
  const { track } = useAnalytics();
  const insets = useSafeAreaInsets();
  useScreenTracking('home');
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!profile) return null;

  const stat = formatMinutes(totalTrainingSeconds);

  const lastSettings = store?.lastSessionSettings ?? null;
  // WordLibrary가 SSoT. lastSettings.libraryEntryId로 직조회해 재녹음/라벨 수정이 즉시 반영되게 한다.
  // libraryEntryId 누락(legacy) 또는 entry 삭제 시 null → handleContinue가 /session-setup으로 fallback.
  const lastWordEntry =
    lastSettings && lastSettings.libraryEntryId
      ? (entries.find((entry) => entry.id === lastSettings.libraryEntryId) ?? null)
      : null;
  const lastCycles = lastSettings
    ? Math.max(1, Math.floor(lastSettings.totalDurationSeconds / (lastSettings.learningDurationSeconds + lastSettings.restDurationSeconds)))
    : undefined;
  const lastMins = lastSettings ? Math.round(lastSettings.totalDurationSeconds / 60) : undefined;

  function handleContinue(): void {
    if (!lastSettings || !lastWordEntry) {
      router.push('/session-setup');
      return;
    }
    const sessionId = createSessionId();
    setPendingSession({
      sessionId,
      wordId: lastSettings.wordId,
      settings: lastSettings,
      audioUri:
        lastWordEntry.sourceType === 'recording'
          ? lastWordEntry.audioUri
          : (resolvePresetAudioModule(lastWordEntry.presetKey) ?? undefined),
      word: lastWordEntry.label,
    });
    track({
      name: 'training_session_started',
      params: {
        session_id: sessionId,
        word_count: 1,
        target_word_ids: [lastSettings.wordId],
        target_word_names: [lastWordEntry.label],
        profile_age_days: profile ? diffDaysIso(profile.createdAt) : 0,
        parrot_species: profile?.species ?? '',
        parrot_name: profile?.name ?? '',
      },
    });
    router.push('/session-active');
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: Spacing.screenBottomTabs + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <HomeGreeting profileName={profile.name} />
      <ParrotSummaryCard profile={profile} />
      <ContinueSessionCard
        lastWord={lastWordEntry?.label}
        cycles={lastCycles}
        mins={lastMins}
        learnMins={lastSettings ? Math.round(lastSettings.learningDurationSeconds / 60) : undefined}
        restMins={lastSettings ? Math.round(lastSettings.restDurationSeconds / 60) : undefined}
        onContinue={handleContinue}
      />

      <View style={styles.wordsSectionRow}>
        <View>
          <Text style={styles.sectionKicker}>현재 학습 중</Text>
          <Text style={styles.sectionTitle}>단어 {entries.length}개</Text>
        </View>
        <Pressable onPress={() => router.push('/words')} style={styles.sectionActionRow}>
          <Text style={styles.sectionAction}>단어 관리</Text>
          <IconSymbol name="chevron.compact.right" size={14} color={BuddyBirdColors.secondaryDeep} />
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
    backgroundColor: BuddyBirdColors.neutral,
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
    color: BuddyBirdColors.kickerMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.primary,
    fontSize: 22,
  },
  sectionActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sectionAction: {
    color: BuddyBirdColors.secondaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
});
