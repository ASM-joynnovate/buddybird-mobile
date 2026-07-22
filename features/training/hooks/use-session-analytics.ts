import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { cycleProgressPercent } from '@/features/training/session-cycle-model';
import type { PendingSession } from '@/features/training/training-context';
import type { UseActiveSessionResult } from '@/features/training/hooks/use-active-session';

interface SessionAnalyticsParams {
  pendingSession: PendingSession;
  session: Pick<UseActiveSessionResult, 'status' | 'cycle' | 'totalCycles' | 'learnSecs' | 'stop' | 'dismissCompletion'>;
  clearPendingSession: () => void;
}

export function useSessionAnalytics({ pendingSession, session, clearPendingSession }: SessionAnalyticsParams) {
  const { track, flushSessionWordMetrics } = useAnalytics();
  const startedAtRef = useRef<number>(null!);
  if (startedAtRef.current === null) {
    startedAtRef.current = Date.now();
  }
  const progressPercent = cycleProgressPercent(session.cycle, session.totalCycles);

  function buildWordDelta(durationMs: number) {
    return {
      word_id: pendingSession.wordId,
      word_name: pendingSession.word,
      practice_duration_ms: durationMs,
      recordings_count: 0,
    } as const;
  }

  function handleStop(): void {
    // 외부 종료(알림 "중지") 후 뒤늦게 복귀한 경우 벽시계 차이에 백그라운드 공백이 섞이므로
    // 설정된 세션 총 길이로 클램프해 지표 오염을 막는다.
    const durationMs = Math.min(
      Date.now() - startedAtRef.current,
      pendingSession.settings.totalDurationSeconds * 1000,
    );
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
    // 화면 이동은 useSessionExit 가 가로채기를 끈 뒤 처리한다.
    setTimeout(() => clearPendingSession(), 0);
  }

  function handleDismiss(): void {
    session.dismissCompletion();
    router.back();
    setTimeout(() => clearPendingSession(), 0);
  }

  useEffect(() => {
    if (session.status !== 'completed') return;
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

  return { handleStop, handleDismiss };
}
