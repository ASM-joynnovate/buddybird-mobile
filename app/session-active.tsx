import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCompletionView } from '@/components/session/running/session-completion-view';
import { SessionRunningView } from '@/components/session/running/session-running-view';
import { BuddyBirdColors } from '@/constants/theme';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useProfile } from '@/features/profile/profile-context';
import { useActiveSession } from '@/features/training/hooks/use-active-session';
import { useSessionAnalytics } from '@/features/training/hooks/use-session-analytics';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds, selectTrainingRewardSummary } from '@/features/training/training-model';

export default function SessionActiveScreen() {
  const insets = useSafeAreaInsets();
  const { pendingSession, clearPendingSession, store } = useTrainingData();
  const { profile } = useProfile();
  const rewardSummary = store ? selectTrainingRewardSummary(store) : null;
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!pendingSession || !profile) return null;

  return (
    <SessionActiveInner
      pendingSession={pendingSession}
      petName={profile.name}
      streakDays={rewardSummary?.currentStreakDays ?? 0}
      totalTrainingSeconds={totalTrainingSeconds}
      clearPendingSession={clearPendingSession}
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
    />
  );
}

function SessionActiveInner({
  pendingSession,
  petName,
  streakDays,
  totalTrainingSeconds,
  clearPendingSession,
  insetsTop,
  insetsBottom,
}: {
  pendingSession: NonNullable<ReturnType<typeof useTrainingData>['pendingSession']>;
  petName: string;
  streakDays: number;
  totalTrainingSeconds: number;
  clearPendingSession: () => void;
  insetsTop: number;
  insetsBottom: number;
}) {
  useScreenTracking('session_active');
  const router = useRouter();
  const session = useActiveSession({
    wordId: pendingSession.wordId,
    settings: pendingSession.settings,
    audioUri: pendingSession.audioUri,
    word: pendingSession.word,
  });
  const { handleStop, handleDismiss } = useSessionAnalytics({ pendingSession, session, clearPendingSession });
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <View style={styles.container}>
      {session.status === 'completed' ? (
        <SessionCompletionView
          petName={petName}
          word={session.currentWord}
          totalLearningSeconds={session.totalLearningSeconds}
          totalTrainingSeconds={totalTrainingSeconds}
          streakDays={streakDays}
          onDismiss={handleDismiss}
          onDebugAccess={() => router.push({ pathname: '/session-captures', params: { sessionId: pendingSession.sessionId, word: session.currentWord } })}
        />
      ) : (
        <SessionRunningView
          session={session}
          onStop={handleStop}
          insetsTop={insetsTop}
          insetsBottom={insetsBottom}
          fmt={fmt}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
  },
});
