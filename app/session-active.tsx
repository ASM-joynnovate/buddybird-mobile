import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCompletionView } from '@/components/session/running/session-completion-view';
import { SessionRunningView } from '@/components/session/running/session-running-view';
import { BuddyBirdColors } from '@/constants/theme';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useActiveSession } from '@/features/training/hooks/use-active-session';
import { useSessionAnalytics } from '@/features/training/hooks/use-session-analytics';
import { useTrainingData } from '@/features/training/training-context';

export default function SessionActiveScreen() {
  const insets = useSafeAreaInsets();
  const { pendingSession, clearPendingSession } = useTrainingData();

  if (!pendingSession) return null;

  return (
    <SessionActiveInner
      pendingSession={pendingSession}
      clearPendingSession={clearPendingSession}
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
    />
  );
}

function SessionActiveInner({
  pendingSession,
  clearPendingSession,
  insetsTop,
  insetsBottom,
}: {
  pendingSession: NonNullable<ReturnType<typeof useTrainingData>['pendingSession']>;
  clearPendingSession: () => void;
  insetsTop: number;
  insetsBottom: number;
}) {
  useScreenTracking('session_active');
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
    <View style={[styles.container, { paddingTop: insetsTop }]}>
      {session.status === 'completed' ? (
        <SessionCompletionView
          word={session.currentWord}
          totalLearningSecondsLabel={fmt(session.totalCycles * session.learnSecs)}
          onDismiss={handleDismiss}
        />
      ) : (
        <SessionRunningView session={session} onStop={handleStop} insetsBottom={insetsBottom} fmt={fmt} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuddyBirdColors.darkBg,
    flex: 1,
  },
});
