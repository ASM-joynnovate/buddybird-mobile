import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useReducer, useRef } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { recordingFileExists } from '@/features/audio/audio-file-storage';
import { configurePlaybackAudioMode } from '@/features/audio/audio-mode';

import type { SessionMeta, SessionStatus } from '../session-config';
import { deriveSessionCycles } from '../session-cycle-model';
import {
  createInitialSessionState,
  PHASE_ADVANCE_DELAY_MS,
  sessionReducer,
  TICK_INTERVAL_MS,
} from '../session-reducer';
import { useTrainingData } from '../training-context';
import { createTrainingSession } from '../training-model';
import type { CreateTrainingSessionInput, TrainingSessionSettings } from '../training-types';

interface UseActiveSessionInput {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string | number;
  word: string;
}

export interface UseActiveSessionResult {
  status: SessionStatus;
  phase: 'learning' | 'rest';
  cycle: number;
  totalCycles: number;
  phaseRemaining: number;
  phaseProgress: number;
  progress: number;
  audioOn: boolean;
  isLearning: boolean;
  currentWord: string;
  togglePause: () => void;
  stop: () => void;
  dismissCompletion: () => void;
  learnSecs: number;
  sessionMins: number;
}

export function useActiveSession({ wordId, settings, audioUri, word }: UseActiveSessionInput): UseActiveSessionResult {
  const { saveCompletedSession } = useTrainingData();

  const learnSecs = settings.learningDurationSeconds;
  const restSecs = settings.restDurationSeconds;
  const { secsPerCycle, totalCycles, sessionMins, totalSessionSeconds, totalLearningSeconds } = deriveSessionCycles({
    totalSeconds: settings.totalDurationSeconds,
    learnSecs,
    restSecs,
  });

  const [state, dispatch] = useReducer(sessionReducer, { learnSecs, restSecs, totalCycles }, createInitialSessionState);
  const { status, phase, cycle, phaseElapsed } = state;

  const sessionMetaRef = useRef<SessionMeta | null>({
    wordId,
    startedAt: new Date().toISOString(),
    sourceType: settings.sourceType,
    totalDurationSeconds: settings.totalDurationSeconds,
    learningDurationSeconds: learnSecs,
    restDurationSeconds: restSecs,
    libraryEntryId: settings.libraryEntryId,
  });

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearSilenceTimer(): void {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  const sessionPlayer = useAudioPlayer(audioUri, { updateInterval: 100 });
  const sessionPlayerStatus = useAudioPlayerStatus(sessionPlayer);

  const isLearning = phase === 'learning';
  const phaseDuration = isLearning ? learnSecs : restSecs;
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));
  const completedCycleSeconds = (cycle - 1) * secsPerCycle;
  const currentPhaseOffsetSeconds = isLearning ? 0 : learnSecs;
  const overallElapsedSeconds = completedCycleSeconds + currentPhaseOffsetSeconds + phaseElapsed;
  const progress = Math.min(1, overallElapsedSeconds / totalSessionSeconds);
  const audioOn = status === 'running' && isLearning && sessionPlayerStatus.playing;

  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => dispatch({ type: 'tick' }), TICK_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [status]);

  useEffect(() => {
    if (status !== 'running' || phaseElapsed < phaseDuration) return;
    const timer = setTimeout(() => dispatch({ type: 'advancePhase' }), PHASE_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phaseElapsed, phaseDuration, status]);

  useEffect(() => {
    if (!audioUri) return;
    // 번들 모듈 번호는 항상 접근 가능하므로 파일 존재 검사를 건너뛴다.
    // 시뮬레이터 클린 reinstall 등으로 파일이 사라진 경우 무음 진행. 크래시 방지.
    if (typeof audioUri === 'string' && !recordingFileExists(audioUri)) {
      reportError(new Error('녹음 파일을 찾을 수 없어 학습 오디오를 재생하지 않습니다.'), {
        scope: 'training.sessionPlayer.missingFile',
      });
      return;
    }
    let isCancelled = false;
    if (status === 'running' && phase === 'learning') {
      sessionPlayer.loop = false;
      configurePlaybackAudioMode()
        .then(() => sessionPlayer.seekTo(0))
        .then(() => {
          if (!isCancelled) sessionPlayer.play();
        })
        .catch((error: unknown) => {
          reportError(error, { scope: 'training.sessionPlayerSetup' });
          if (!isCancelled) sessionPlayer.play();
        });
    } else {
      clearSilenceTimer();
      sessionPlayer.pause();
    }
    return () => {
      isCancelled = true;
      clearSilenceTimer();
    };
  }, [phase, status, audioUri, sessionPlayer]);

  useEffect(() => {
    if (status !== 'running' || phase !== 'learning') return;
    if (!sessionPlayerStatus.didJustFinish) return;

    const rawDuration = sessionPlayerStatus.duration;
    const gapMs = typeof rawDuration === 'number' && rawDuration > 0 ? rawDuration * 1000 : 0;

    let isCancelled = false;
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (isCancelled) return;
      sessionPlayer
        .seekTo(0)
        .then(() => {
          if (!isCancelled) sessionPlayer.play();
        })
        .catch((error: unknown) => {
          reportError(error, { scope: 'training.sessionPlayer.gapReplay' });
          if (!isCancelled) sessionPlayer.play();
        });
    }, gapMs);
    // 타이머는 취소하지 않음 — didJustFinish는 한 사이클만 true이므로 타이머는 fire되어야 함.
    // isCancelled로 언마운트 후 해제된 네이티브 플레이어 호출만 방지.
    return () => {
      isCancelled = true;
    };
  }, [sessionPlayerStatus.didJustFinish, sessionPlayerStatus.duration, status, phase, sessionPlayer]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        sessionPlayer.pause();
      } catch (error: unknown) {
        // expo-audio player가 이미 teardown 상태일 수 있음. cleanup 단계라 복구 불필요.
        console.warn('[training.sessionPlayer.cleanup]', error);
      }
    };
  }, [sessionPlayer]);

  useEffect(() => {
    if (status !== 'completed') return;
    const meta = sessionMetaRef.current;
    if (!meta) return;
    const endedAt = new Date().toISOString();
    const session = createTrainingSession(
      {
        wordId: meta.wordId,
        sourceType: meta.sourceType,
        totalDurationSeconds: meta.totalDurationSeconds,
        learningDurationSeconds: meta.learningDurationSeconds,
        restDurationSeconds: meta.restDurationSeconds,
        completedCycles: totalCycles,
        totalLearningSeconds,
        startedAt: meta.startedAt,
        endedAt,
        libraryEntryId: meta.libraryEntryId,
      } satisfies CreateTrainingSessionInput,
      endedAt
    );
    saveCompletedSession(session);
  }, [status, totalCycles, totalLearningSeconds, saveCompletedSession]);

  function togglePause(): void {
    dispatch({ type: 'togglePause' });
  }

  function stop(): void {
    sessionMetaRef.current = null;
    dispatch({ type: 'reset' });
  }

  function dismissCompletion(): void {
    sessionMetaRef.current = null;
    dispatch({ type: 'reset' });
  }

  return {
    status,
    phase,
    cycle,
    totalCycles,
    phaseRemaining,
    phaseProgress,
    progress,
    audioOn,
    isLearning,
    currentWord: word,
    togglePause,
    stop,
    dismissCompletion,
    learnSecs,
    sessionMins,
  };
}
