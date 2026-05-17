import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCompletionView } from '@/components/session/running/session-completion-view';
import { SessionControls } from '@/components/session/running/session-controls';
import { SessionHeader } from '@/components/session/running/session-header';
import { SessionPhaseBadge } from '@/components/session/running/session-phase-badge';
import { SessionProgressRing } from '@/components/session/running/session-progress-ring';
import { SessionWaveSection } from '@/components/session/running/session-wave-section';
import { BuddyBirdColors } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
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
  const { track, flushSessionWordMetrics } = useAnalytics();
  useScreenTracking('session_active');
  const startedAtRef = useRef(Date.now());
  const session = useActiveSession({
    wordId: pendingSession.wordId,
    settings: pendingSession.settings,
    audioUri: pendingSession.audioUri,
    word: pendingSession.word,
  });

  const totalCycles = session.totalCycles;
  const progressPercent = totalCycles > 0 ? Math.round((session.cycle / totalCycles) * 100) : 0;

  function buildWordDelta(durationMs: number) {
    return {
      word_id: pendingSession.wordId,
      word_name: pendingSession.word,
      practice_duration_ms: durationMs,
      recordings_count: 0,
    } as const;
  }

  function handleStop(): void {
    const durationMs = Date.now() - startedAtRef.current;

    track({
      name: 'training_session_abandoned',
      params: {
        session_id: pendingSession.sessionId,
        duration_ms: durationMs,
        progress_percent: progressPercent,
        last_word_id: pendingSession.wordId,
        last_word_name: pendingSession.word,
      },
    });

    void flushSessionWordMetrics([buildWordDelta(durationMs)]);

    session.stop();
    router.back();
    setTimeout(() => clearPendingSession(), 0);
  }

  function handleDismiss(): void {
    session.dismissCompletion();
    router.back();
    setTimeout(() => clearPendingSession(), 0);
  }

  useEffect(() => {
    if (session.status !== 'completed') {
      return;
    }

    const durationMs = Date.now() - startedAtRef.current;
    const totalRecordings = pendingSession.audioUri ? 1 : 0;
    const avgRecordingMs = totalRecordings > 0 ? session.learnSecs * 1000 : 0;

    track({
      name: 'training_session_completed',
      params: {
        session_id: pendingSession.sessionId,
        total_duration_ms: durationMs,
        words_practiced_count: 1,
        words_recorded_count: totalRecordings,
        words_skipped_count: 0,
        total_recordings: totalRecordings,
        avg_recording_duration_ms: avgRecordingMs,
      },
    });

    void flushSessionWordMetrics([
      {
        word_id: pendingSession.wordId,
        word_name: pendingSession.word,
        practice_duration_ms: durationMs,
        recordings_count: totalRecordings,
      },
    ]);
  }, [
    session.status,
    session.learnSecs,
    track,
    flushSessionWordMetrics,
    pendingSession.sessionId,
    pendingSession.wordId,
    pendingSession.word,
    pendingSession.audioUri,
  ]);

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
    backgroundColor: BuddyBirdColors.darkBg,
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
