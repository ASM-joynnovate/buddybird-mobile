import { useEffect, useReducer, useRef } from 'react';

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

import { useFollowAlongCapture } from './use-follow-along-capture';
import { useSessionAudioPlayer } from './use-session-audio-player';
import { useSessionKeepAwake } from './use-session-keep-awake';

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
  const { saveCompletedSession, pendingSession } = useTrainingData();

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

  const isLearning = phase === 'learning';
  const phaseDuration = isLearning ? learnSecs : restSecs;
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));
  const completedCycleSeconds = (cycle - 1) * secsPerCycle;
  const currentPhaseOffsetSeconds = isLearning ? 0 : learnSecs;
  const overallElapsedSeconds = completedCycleSeconds + currentPhaseOffsetSeconds + phaseElapsed;
  const progress = Math.min(1, overallElapsedSeconds / totalSessionSeconds);

  const { audioOn, inFollowGap } = useSessionAudioPlayer({ audioUri, phase, status });

  // 따라하기 무음 갭 동안에만 VAD 녹음 + 로컬 캡처(발화 감지 시). UI 노출 없음.
  useFollowAlongCapture({
    enabled: inFollowGap,
    sessionId: pendingSession?.sessionId ?? '',
    wordId,
    cycle,
  });

  // 학습 진행 중에는 화면 자동 꺼짐을 막아 부재중에도 학습이 끊기지 않게 한다.
  useSessionKeepAwake(status === 'running');

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
