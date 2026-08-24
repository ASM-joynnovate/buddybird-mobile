import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { readWordLifetimeMetrics } from '@/features/analytics/word-metrics-storage';
import { useI18n } from '@/features/i18n/i18n-context';
import { createSessionId } from '@/features/shared/ids';
import {
  sessionAudioEngine,
  type CapturedSegment,
  type SessionEngineFailure,
  type SessionEnginePhase,
  type SessionEngineSnapshot,
  type SessionRecoveryRecord,
} from '@/modules/session-audio-engine';

import { requestCaptureFlush } from '../follow-along-upload';
import { storeNativeCapturedSegments } from '../native-session-capture-storage';
import type { SessionStatus } from '../session-config';
import {
  completedCyclesAtPosition,
  deriveSessionCycles,
  elapsedLearningSeconds,
  STREAK_QUALIFYING_SECONDS,
} from '../session-cycle-model';
import { prepareSessionAudioUri, prepareSessionCaptureDirectoryUri } from '../session-audio-assets';
import { MAX_PENDING_CAPTURE_BYTES, SESSION_VAD_CONFIG } from '../session-audio-engine-config';
import { STRESS_CARE_TRACK_MODULES } from '../stress-care-tracks';
import { useTrainingData } from '../training-context';
import { createTrainingSession } from '../training-model';
import type { CreateTrainingSessionInput, TrainingSessionSettings } from '../training-types';
import { useSessionKeepAwake } from './use-session-keep-awake';
import { useSessionPerf } from './use-session-perf';

// 네이티브 주도 종료(알림 "중지" 등) 감지 대상 — starting은 start가 아직 in-flight라
// 네이티브에 세션이 없는 게 정상이므로 오탐 방지를 위해 제외한다.
const EXTERNALLY_ENDED_STATUSES: SessionStatus[] = ['running', 'paused', 'interrupted'];

interface UseActiveSessionInput {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string | number;
  word: string;
}

export interface UseActiveSessionResult {
  // 엔진에 실제로 붙은 세션 id — 재시도하면 pendingSession.sessionId와 달라진다.
  sessionId: string;
  status: SessionStatus;
  endedExternally: boolean;
  failure: SessionEngineFailure | null;
  // true면 세션이 진행되다 실패한 것 — "시작 실패"와 구분해 표기한다.
  failedDuringSession: boolean;
  phase: SessionEnginePhase;
  cycle: number;
  totalCycles: number;
  phaseRemaining: number;
  phaseProgress: number;
  progress: number;
  audioOn: boolean;
  isLearning: boolean;
  currentWord: string;
  togglePause: () => void;
  retry: () => void;
  stop: () => void;
  dismissCompletion: () => void;
  learnSecs: number;
  sessionMins: number;
  totalLearningSeconds: number;
}

export function useActiveSession({ wordId, settings, audioUri, word }: UseActiveSessionInput): UseActiveSessionResult {
  const { saveCompletedSession, pendingSession } = useTrainingData();
  const { track } = useAnalytics();
  const { t } = useI18n();
  const sessionId = pendingSession?.sessionId ?? '';
  const learnSecs = settings.learningDurationSeconds;
  const restSecs = settings.restDurationSeconds;
  const careSecs = settings.stressCareDurationSeconds ?? 0;
  const { totalCycles, sessionMins, totalSessionSeconds } = deriveSessionCycles({
    totalSeconds: settings.totalDurationSeconds,
    learnSecs,
    restSecs,
    careSecs,
  });
  // 재시도 런은 새 엔진 세션 id로 돈다 — 도중 실패 시 진행분이 기존 id로 이미 저장됐을 수 있고,
  // 저장소는 같은 id의 세션을 무시하기 때문이다(completeTrainingSession).
  const [engineSessionId, setEngineSessionId] = useState(sessionId);
  const [snapshot, setSnapshot] = useState<SessionEngineSnapshot>(() => initialSnapshot(sessionId));
  const [endedExternally, setEndedExternally] = useState(false);
  const [failure, setFailure] = useState<SessionEngineFailure | null>(null);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const completionHandledRef = useRef(false);
  const failureHandledRef = useRef(false);
  const hadRunRef = useRef(false);
  const retryingRef = useRef(false);
  const finalizePromiseRef = useRef<Promise<void> | null>(null);
  // word_practice_completed 파라미터용 세션 내 카운터 (캡처 세그먼트 수·목표 음원 재생 수).
  const capturedCountRef = useRef(0);
  const playCountRef = useRef(0);
  const playStartAtRef = useRef<number | null>(null);

  const acceptSnapshot = useCallback((next: SessionEngineSnapshot): void => {
    if (next.sessionId !== engineSessionId) return;
    // 진행 계열 상태를 지났거나 진행 시간이 쌓인 스냅샷이면 이후 실패는 "시작 실패"가
    // 아니라 도중 실패다. elapsed 조건은 백그라운드에서 이미 failed가 된 세션을
    // 재진입으로 이어받는 경우(진행 계열 상태를 관측하지 못함)를 커버한다.
    if (
      next.state === 'running' ||
      next.state === 'paused' ||
      next.state === 'interrupted' ||
      next.elapsedRunningMs > 0
    ) {
      hadRunRef.current = true;
    }
    setSnapshot(next);
  }, [engineSessionId]);

  const storeSegment = useCallback(async (segment: CapturedSegment): Promise<void> => {
    if (segment.sessionId !== engineSessionId) return;
    capturedCountRef.current += 1;
    try {
      await storeNativeCapturedSegments([segment], wordId);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.sessionAudio.storeSegment' });
    }
  }, [engineSessionId, wordId]);

  const syncUnstoredSegments = useCallback(async (): Promise<void> => {
    try {
      const segments = await sessionAudioEngine.getUnstoredSegments();
      await storeNativeCapturedSegments(segments.filter((segment) => segment.sessionId === engineSessionId), wordId);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.sessionAudio.syncSegments' });
    }
  }, [engineSessionId, wordId]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribers = [
      sessionAudioEngine.onStateChanged(acceptSnapshot),
      sessionAudioEngine.onProgress(acceptSnapshot),
      sessionAudioEngine.onSegmentCaptured((segment) => { void storeSegment(segment); }),
      sessionAudioEngine.onFailure((nativeFailure) => {
        reportError(new Error(`${nativeFailure.code}: ${nativeFailure.message}`), { scope: 'training.sessionAudio.native' });
        if (!cancelled) setFailure(nativeFailure);
      }),
    ];

    // 신규 시작 경로에서만 발화 — startNativeSession의 기존 세션 복귀(remount) early return
    // 경로에서는 호출되지 않는다.
    async function trackPracticeStarted(): Promise<void> {
      const lifetime = await readWordLifetimeMetrics(wordId).catch((error: unknown) => {
        console.warn('[training.practiceStarted]', error);
        return null;
      });
      track({
        name: 'word_practice_started',
        params: {
          session_id: sessionId,
          word_id: wordId,
          word_name: word,
          attempt_number: (lifetime?.lifetime_practice_count ?? 0) + 1,
          cumulative_practice_count: lifetime?.lifetime_practice_count ?? 0,
          cumulative_practice_duration_ms: lifetime?.lifetime_practice_duration_ms ?? 0,
        },
      });
    }

    async function startNativeSession(): Promise<void> {
      let audioSourceReady = false;
      try {
        const existing = await sessionAudioEngine.getSnapshot();
        if (existing?.sessionId === engineSessionId) {
          if (!cancelled) acceptSnapshot(existing);
          await syncUnstoredSegments();
          return;
        }
        if (!engineSessionId || audioUri === undefined) throw new Error('세션 음원 또는 세션 ID가 없습니다.');
        const targetAudioUri = await prepareSessionAudioUri(audioUri);
        // 스트레스 케어 트랙(BB-380)은 전부 로컬 URI로 준비해 넘긴다 — 구간마다 하나를
        // 랜덤 재생하는 추첨은 백그라운드에서 구간이 시작되므로 네이티브가 수행한다.
        const stressCareAudioUris = careSecs > 0
          ? await Promise.all(STRESS_CARE_TRACK_MODULES.map((module) => prepareSessionAudioUri(module)))
          : [];
        audioSourceReady = true;
        const next = await sessionAudioEngine.start({
          sessionId: engineSessionId,
          targetAudioUri,
          captureDirectoryUri: prepareSessionCaptureDirectoryUri(),
          totalDurationMs: settings.totalDurationSeconds * 1000,
          learningDurationMs: learnSecs * 1000,
          restDurationMs: restSecs * 1000,
          stressCareDurationMs: careSecs * 1000,
          stressCareAudioUris,
          maxPendingCaptureBytes: MAX_PENDING_CAPTURE_BYTES,
          vad: SESSION_VAD_CONFIG,
          recovery: {
            wordId,
            word,
            sourceType: settings.sourceType,
            libraryEntryId: settings.libraryEntryId,
            startedAt: new Date().toISOString(),
          },
          // 잠금화면 알림 문구. 네이티브 문자열 리소스는 OS 로케일을 따라가 인앱 언어 토글이
          // 반영되지 않으므로(docs/I18N.md) 해석된 문구를 넘긴다. 회차 자리표시자는 네이티브가
          // 매 갱신마다 치환해야 하므로 자기 자신을 값으로 넘겨 i18n-js 보간에서 살려 둔다
          // (미지정 시 i18n-js가 `[missing ... value]`로 바꾼다).
          // 문구는 start 시점에 고정된다 — 세션 도중 언어를 바꾸면 다음 세션부터 반영된다.
          notification: {
            learningSubtitle: t('sessionNotification.learningSubtitle', { cycle: '%{cycle}', total: '%{total}' }),
            restSubtitle: t('sessionNotification.restSubtitle', { cycle: '%{cycle}', total: '%{total}' }),
            stressCareSubtitle: t('sessionNotification.stressCareSubtitle', { cycle: '%{cycle}', total: '%{total}' }),
            pausedSubtitle: t('sessionNotification.pausedSubtitle'),
          },
        });
        if (!cancelled) acceptSnapshot(next);
        if (!cancelled) void trackPracticeStarted();
        await syncUnstoredSegments();
      } catch (error: unknown) {
        reportError(error, { scope: 'training.sessionAudio.start', screen_name: 'session_active' });
        if (cancelled) return;
        // 네이티브가 code를 emit하지 못한 경로(JS 준비 실패 등) 대비 fallback —
        // onFailure 이벤트로 이미 받은 code를 덮지 않는다.
        setFailure((current) => current ?? {
          code: audioSourceReady ? 'audio-engine-failed' : 'audio-source-unavailable',
          message: error instanceof Error ? error.message : String(error),
          recoverable: false,
        });
        setSnapshot((current) => ({ ...current, state: 'failed' }));
      }
    }

    void startNativeSession();
    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    acceptSnapshot,
    audioUri,
    careSecs,
    engineSessionId,
    learnSecs,
    restSecs,
    settings.libraryEntryId,
    settings.sourceType,
    settings.totalDurationSeconds,
    storeSegment,
    syncUnstoredSegments,
    t,
    track,
    word,
    wordId,
  ]);

  // 목표 음원 재생 추적 — isTargetPlaying false→true 전이를 재생 1회로 카운트하고,
  // true→false 전이 시점에 재생 시간을 확정해 recording_played 를 발화한다.
  useEffect(() => {
    if (snapshot.isTargetPlaying) {
      if (playStartAtRef.current === null) {
        playStartAtRef.current = Date.now();
        playCountRef.current += 1;
      }
      return;
    }
    if (playStartAtRef.current === null) return;
    const playbackDurationMs = Date.now() - playStartAtRef.current;
    playStartAtRef.current = null;
    track({
      name: 'recording_played',
      params: {
        session_id: sessionId,
        word_id: wordId,
        word_name: word,
        play_count: playCountRef.current,
        playback_duration_ms: playbackDurationMs,
      },
    });
  }, [sessionId, snapshot.isTargetPlaying, track, word, wordId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void sessionAudioEngine.getSnapshot().then((next) => {
          if (next) {
            acceptSnapshot(next);
            return;
          }
          // 알림 "중지" 같은 네이티브 주도 종료는 이벤트를 emit하지 않는다 — 로컬이 진행
          // 계열인데 네이티브에 세션이 없으면 외부 종료로 간주해 화면 이탈을 트리거한다.
          if (EXTERNALLY_ENDED_STATUSES.includes(snapshotRef.current.state)) setEndedExternally(true);
        }).catch((error: unknown) => reportError(error, { scope: 'training.sessionAudio.getSnapshot' }));
        void syncUnstoredSegments();
        return;
      }
      const currentSnapshot = snapshotRef.current;
      if (nextState !== 'background' || currentSnapshot.state !== 'running' || !sessionId) return;
      track({
        name: 'training_session_backgrounded',
        params: {
          session_id: sessionId,
          phase: currentSnapshot.phase,
          elapsed_seconds: Math.floor(currentSnapshot.elapsedRunningMs / 1000),
        },
      });
    });
    return () => subscription.remove();
  }, [acceptSnapshot, sessionId, syncUnstoredSegments, track]);

  const persistRecovery = useCallback(async (record: SessionRecoveryRecord): Promise<void> => {
    const elapsedSeconds = Math.floor(record.snapshot.elapsedRunningMs / 1000);
    const shouldPersist = record.reason === 'duration-reached' || elapsedSeconds >= STREAK_QUALIFYING_SECONDS;
    if (!shouldPersist) {
      await sessionAudioEngine.clearPendingRecovery(record.snapshot.sessionId);
      return;
    }

    const endedAt = new Date().toISOString();
    const phaseElapsedSeconds = Math.floor(record.snapshot.phaseElapsedMs / 1000);
    const totalLearningSeconds = elapsedLearningSeconds(
      record.snapshot.cycle,
      record.snapshot.phase,
      phaseElapsedSeconds,
      record.learningDurationMs / 1000,
    );
    const session = {
      ...createTrainingSession(
      {
        wordId: record.recovery.wordId,
        sourceType: record.recovery.sourceType,
        totalDurationSeconds: record.totalDurationMs / 1000,
        learningDurationSeconds: record.learningDurationMs / 1000,
        restDurationSeconds: record.restDurationMs / 1000,
        stressCareDurationSeconds: (record.stressCareDurationMs ?? 0) / 1000,
        completedCycles: completedCyclesAtPosition(
          record.snapshot.cycle,
          record.snapshot.phase,
          phaseElapsedSeconds,
          record.restDurationMs / 1000,
          (record.stressCareDurationMs ?? 0) / 1000,
        ),
        totalLearningSeconds,
        startedAt: record.recovery.startedAt,
        endedAt,
        libraryEntryId: record.recovery.libraryEntryId,
      } satisfies CreateTrainingSessionInput,
      endedAt,
      ),
      id: record.snapshot.sessionId,
    };
    await saveCompletedSession(session);
    await sessionAudioEngine.clearPendingRecovery(record.snapshot.sessionId);
  }, [saveCompletedSession]);

  const finalizeSession = useCallback((): Promise<void> => {
    if (finalizePromiseRef.current) return finalizePromiseRef.current;
    const operation = sessionAudioEngine.stop()
      .then(persistRecovery)
      .catch((error: unknown) => {
        reportError(error, { scope: 'training.sessionAudio.stop', screen_name: 'session_active' });
      })
      .then(() => {
        // 업로드 트리거 ② (SPEC-0003): 세션 종료(정상 완료·중도 종료·외부 종료·실패 정리
        // 전부 이 깔때기를 지난다) 시 미전송 클립 flush. 정리 성패와 무관하게 건다.
        requestCaptureFlush();
      });
    finalizePromiseRef.current = operation;
    return operation;
  }, [persistRecovery]);

  useEffect(() => {
    if (snapshot.state !== 'completed' || completionHandledRef.current) return;
    completionHandledRef.current = true;
    track({
      name: 'word_practice_completed',
      params: {
        session_id: sessionId,
        word_id: wordId,
        word_name: word,
        practice_duration_ms: snapshotRef.current.elapsedRunningMs,
        recordings_count: capturedCountRef.current,
        replay_count: Math.max(0, playCountRef.current - 1),
      },
    });
    void finalizeSession();
  }, [finalizeSession, sessionId, snapshot.state, track, word, wordId]);

  // 실패한 세션도 stop()으로 네이티브 configuration을 비워야 다음 start()가 거부되지 않는다.
  // 로컬에서만 failed로 표시된 경우(start 자체가 실패)는 네이티브에 세션이 없을 수 있으므로,
  // 실제 네이티브 세션이 우리 것이거나 종단 상태로 잔존할 때만 정리한다.
  useEffect(() => {
    if (snapshot.state !== 'failed' || failureHandledRef.current) return;
    failureHandledRef.current = true;
    void sessionAudioEngine.getSnapshot()
      .then((native) => {
        if (!native) return;
        if (native.sessionId !== engineSessionId && native.state !== 'failed' && native.state !== 'completed') return;
        return finalizeSession();
      })
      .catch((error: unknown) => {
        reportError(error, { scope: 'training.sessionAudio.finalizeFailed', screen_name: 'session_active' });
      });
  }, [engineSessionId, finalizeSession, snapshot.state]);

  // 실패 상태에서 새 엔진 세션으로 처음부터 다시 시작한다. 도중 실패라면 finalize가
  // 네이티브 정리와 진행분 저장(기준 시간 이상)을 먼저 끝낸다.
  const retry = useCallback((): void => {
    // 연타 가드: 체인이 도는 동안 두 번째 재시도가 겹치면 서로 다른 새 세션 id 두 개가
    // 경합해 나중 start가 sessionAlreadyRunning으로 거부된다. ref로 재진입을 막고,
    // 스냅샷을 즉시 starting으로 바꿔 버튼도 비활성화한다.
    if (retryingRef.current) return;
    retryingRef.current = true;
    setSnapshot((current) => ({ ...current, state: 'starting' }));
    void sessionAudioEngine.getSnapshot()
      .then((native) => {
        if (native) return finalizeSession();
      })
      .catch((error: unknown) => {
        reportError(error, { scope: 'training.sessionAudio.retry', screen_name: 'session_active' });
      })
      .then(() => {
        failureHandledRef.current = false;
        completionHandledRef.current = false;
        finalizePromiseRef.current = null;
        hadRunRef.current = false;
        const nextId = createSessionId();
        setFailure(null);
        setSnapshot(initialSnapshot(nextId));
        setEngineSessionId(nextId);
        retryingRef.current = false;
      });
  }, [finalizeSession]);

  useSessionKeepAwake(snapshot.state === 'running');
  useSessionPerf({ engineSessionId, sessionId });

  function togglePause(): void {
    const command = snapshot.state === 'running' ? sessionAudioEngine.pause() : sessionAudioEngine.resume();
    void command.then(acceptSnapshot).catch((error: unknown) => {
      reportError(error, { scope: 'training.sessionAudio.togglePause', screen_name: 'session_active' });
    });
  }

  function stop(): void {
    void finalizeSession();
  }

  function dismissCompletion(): void {
    setSnapshot((current) => ({ ...current, state: 'idle' }));
  }

  const phaseElapsed = snapshot.phaseElapsedMs / 1000;
  const phaseDuration = snapshot.phase === 'learning' ? learnSecs : snapshot.phase === 'stress-care' ? careSecs : restSecs;
  const elapsedSeconds = snapshot.elapsedRunningMs / 1000;
  const creditedLearningSeconds = elapsedLearningSeconds(snapshot.cycle, snapshot.phase, phaseElapsed, learnSecs);

  return {
    sessionId: engineSessionId,
    status: snapshot.state,
    endedExternally,
    failure,
    failedDuringSession: snapshot.state === 'failed' && hadRunRef.current,
    phase: snapshot.phase,
    cycle: Math.min(snapshot.cycle, totalCycles),
    totalCycles,
    phaseRemaining: Math.max(0, Math.ceil(phaseDuration - phaseElapsed)),
    phaseProgress: Math.min(1, phaseElapsed / Math.max(1, phaseDuration)),
    progress: Math.min(1, elapsedSeconds / totalSessionSeconds),
    audioOn: snapshot.state === 'running' && snapshot.isTargetPlaying,
    isLearning: snapshot.phase === 'learning',
    currentWord: word,
    togglePause,
    retry,
    stop,
    dismissCompletion,
    learnSecs,
    sessionMins,
    totalLearningSeconds: creditedLearningSeconds,
  };
}

function initialSnapshot(sessionId: string): SessionEngineSnapshot {
  return {
    sessionId,
    state: 'starting',
    elapsedRunningMs: 0,
    cycle: 1,
    phase: 'learning',
    phaseElapsedMs: 0,
    isTargetPlaying: false,
    savedAt: new Date().toISOString(),
  };
}
