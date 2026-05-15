import { useMemo, useState } from 'react';

import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';

import { useTrainingData } from '../training-context';
import { createTrainingWord, selectTrainingWordSummaries } from '../training-model';
import { SESSION_PRESETS } from '../session-config';
import type { SessionPresetKey } from '../session-config';
import type { AudioPitchTransform, TrainingAudioSourceType, TrainingSessionSettings } from '../training-types';

export interface SessionSelection {
  audioUri: string;
  label: string;
  presetKey?: string;
  sourceType: TrainingAudioSourceType;
}

export interface SaveSessionSetupResult {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string;
  word: string;
}

export interface UseSessionSetupResult {
  presetKey: SessionPresetKey;
  setPresetKey: (key: SessionPresetKey) => void;
  sessionMins: number;
  setSessionMins: (n: number) => void;
  learnSecs: number;
  setLearnSecs: (n: number) => void;
  restSecs: number;
  setRestSecs: (n: number) => void;
  totalCycles: number;
  isHydrated: boolean;
  trainingErrorMessage: string | null;
  saveErrorMessage: string | null;
  getSessionCountForPreset: (presetKey: string | undefined) => number;
  saveSessionSetup: (selection: SessionSelection) => Promise<SaveSessionSetupResult | null>;
}

export function useSessionSetup(): UseSessionSetupResult {
  const { locale, t } = useI18n();
  const {
    store,
    errorMessage: trainingErrorMessage,
    isHydrated,
    saveLastSessionSettings,
    upsertWord,
  } = useTrainingData();

  const [presetKey, setPresetKeyState] = useState<SessionPresetKey>('short');
  const [sessionMins, setSessionMins] = useState(60);
  const [learnSecs, setLearnSecs] = useState(600);
  const [restSecs, setRestSecs] = useState(300);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  function setPresetKey(key: SessionPresetKey) {
    setPresetKeyState(key);
    if (key === 'custom') {
      setSessionMins(20);
      setLearnSecs(60);
      setRestSecs(30);
    } else {
      const preset = SESSION_PRESETS.find((p) => p.key === key)!;
      setLearnSecs(preset.learnSecs);
      setRestSecs(preset.restSecs);
      setSessionMins((preset.learnSecs + preset.restSecs) / 60 * preset.cycles);
    }
  }

  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor((sessionMins * 60) / secsPerCycle));

  const wordSummaries = useMemo(
    () => (store ? selectTrainingWordSummaries(store) : []),
    [store]
  );

  function getSessionCountForPreset(presetKey: string | undefined): number {
    if (!presetKey) return 0;
    return wordSummaries
      .filter((s) => s.word.presetKey === presetKey)
      .reduce((sum, s) => sum + s.progress.sessionCount, 0);
  }

  async function saveSessionSetup(selection: SessionSelection): Promise<SaveSessionSetupResult | null> {
    if (!isHydrated) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return null;
    }
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso) as AudioPitchTransform;

      const word = createTrainingWord(
        {
          audioUri: selection.audioUri,
          locale,
          label: selection.label,
          presetKey: selection.presetKey,
          sourceType: selection.sourceType,
          pitchTransform,
        },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        sourceType: selection.sourceType,
        totalDurationSeconds: sessionMins * 60,
        wordId: word.id,
      };
      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      return {
        wordId: word.id,
        settings,
        audioUri: selection.sourceType === 'recording' ? selection.audioUri : undefined,
        word: selection.label,
      };
    } catch {
      setSaveErrorMessage(t('sessionSetup.saveError'));
      return null;
    }
  }

  return {
    presetKey,
    setPresetKey,
    sessionMins,
    setSessionMins,
    learnSecs,
    setLearnSecs,
    restSecs,
    setRestSecs,
    totalCycles,
    isHydrated,
    trainingErrorMessage,
    saveErrorMessage,
    getSessionCountForPreset,
    saveSessionSetup,
  };
}
