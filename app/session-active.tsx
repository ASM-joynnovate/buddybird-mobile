import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCompletionView } from '@/components/session/running/session-completion-view';
import { SessionControls } from '@/components/session/running/session-controls';
import { SessionHeader } from '@/components/session/running/session-header';
import { SessionPhaseBadge } from '@/components/session/running/session-phase-badge';
import { SessionProgressRing } from '@/components/session/running/session-progress-ring';
import { SessionWaveSection } from '@/components/session/running/session-wave-section';
import { PetHubColors } from '@/constants/theme';
import { useActiveSession } from '@/features/training/hooks/use-active-session';
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
  const session = useActiveSession({
    wordId: pendingSession.wordId,
    settings: pendingSession.settings,
    audioUri: pendingSession.audioUri,
    word: pendingSession.word,
  });

  function handleStop(): void {
    session.stop();
    router.back();
    setTimeout(() => clearPendingSession(), 0);
  }

  function handleDismiss(): void {
    session.dismissCompletion();
    router.back();
    setTimeout(() => clearPendingSession(), 0);
  }

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
        <>
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: session.isLearning ? 'rgba(94,234,212,0.22)' : 'rgba(253,186,116,0.18)' },
            ]}
          />
          <SessionHeader
            sessionMins={session.sessionMins}
            cycle={session.cycle}
            totalCycles={session.totalCycles}
            onStop={handleStop}
          />
          <SessionPhaseBadge isLearning={session.isLearning} />
          <SessionProgressRing
            isLearning={session.isLearning}
            phaseProgress={session.phaseProgress}
            word={session.currentWord}
            timerLabel={fmt(session.phaseRemaining)}
          />
          <SessionWaveSection isLearning={session.isLearning} />
          <SessionControls
            isRunning={session.status === 'running'}
            isLearning={session.isLearning}
            cycle={session.cycle}
            totalCycles={session.totalCycles}
            paddingBottom={insetsBottom + 16}
            onToggle={session.togglePause}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PetHubColors.darkBg,
    flex: 1,
  },
  gradientOverlay: {
    borderRadius: 999,
    height: 300,
    left: '50%',
    marginLeft: -150,
    marginTop: -60,
    position: 'absolute',
    top: 0,
    width: 300,
  },
});
