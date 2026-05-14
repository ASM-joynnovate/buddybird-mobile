import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import type { SessionMeta, SessionStatus } from '../session-config';
import { useTrainingData } from '../training-context';
import { createTrainingSession } from '../training-model';
import type { CreateTrainingSessionInput, TrainingSessionSettings } from '../training-types';

interface UseActiveSessionInput {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string;
  word: string;
}

export interface UseActiveSessionResult {
  status: SessionStatus;
  phase: 'learning' | 'rest';
  cycle: number;
  totalCycles: number;
  phaseRemaining: number;
  phaseProgress: number;
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
  const sessionMins = Math.round(settings.totalDurationSeconds / 60);
  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor(settings.totalDurationSeconds / secsPerCycle));

  const [status, setStatus] = useState<SessionStatus>('running');
  const [phase, setPhase] = useState<'learning' | 'rest'>('learning');
  const [cycle, setCycle] = useState(1);
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  const sessionMetaRef = useRef<SessionMeta | null>({
    wordId,
    startedAt: new Date().toISOString(),
    sourceType: settings.sourceType,
    totalDurationSeconds: settings.totalDurationSeconds,
    learningDurationSeconds: learnSecs,
    restDurationSeconds: restSecs,
  });

  const sessionPlayer = useAudioPlayer(audioUri);

  const isLearning = phase === 'learning';
  const phaseDuration = isLearning ? learnSecs : restSecs;
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));

  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => {
      setPhaseElapsed((prev) => (prev >= phaseDuration ? prev : Math.min(prev + 1, phaseDuration)));
    }, 1000);
    return () => clearInterval(iv);
  }, [status, phaseDuration]);

  useEffect(() => {
    if (status !== 'running' || phaseElapsed < phaseDuration) return;
    const timer = setTimeout(() => {
      if (phase === 'learning') {
        setPhase('rest');
        setPhaseElapsed(0);
        return;
      }
      if (cycle >= totalCycles) {
        setStatus('completed');
        setCycle(1);
        setPhase('learning');
        setPhaseElapsed(0);
        return;
      }
      setCycle((c) => c + 1);
      setPhase('learning');
      setPhaseElapsed(0);
    }, 980);
    return () => clearTimeout(timer);
  }, [phaseElapsed, phaseDuration, status, phase, cycle, totalCycles]);

  useEffect(() => {
    if (!audioUri) return;
    if (status === 'running' && phase === 'learning') {
      sessionPlayer.loop = true;
      sessionPlayer.seekTo(0);
      sessionPlayer.play();
    } else {
      sessionPlayer.pause();
    }
  }, [phase, status, audioUri, sessionPlayer]);

  useEffect(() => {
    return () => {
      try {
        sessionPlayer.pause();
      } catch {
        /* noop: expo-audio may already be torn down */
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
        totalLearningSeconds: totalCycles * meta.learningDurationSeconds,
        startedAt: meta.startedAt,
        endedAt,
      } satisfies CreateTrainingSessionInput,
      endedAt
    );
    saveCompletedSession(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function togglePause(): void {
    setStatus((prev) => (prev === 'running' ? 'paused' : 'running'));
  }

  function stop(): void {
    sessionMetaRef.current = null;
    setStatus('idle');
  }

  function dismissCompletion(): void {
    sessionMetaRef.current = null;
    setStatus('idle');
  }

  return {
    status,
    phase,
    cycle,
    totalCycles,
    phaseRemaining,
    phaseProgress,
    isLearning,
    currentWord: word,
    togglePause,
    stop,
    dismissCompletion,
    learnSecs,
    sessionMins,
  };
}
