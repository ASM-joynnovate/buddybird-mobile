import { useMemo, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';

import { resolvePresetAudioModule } from '@/features/word-library/word-library-preset-audio';

import { deriveSessionCycles } from '../session-cycle-model';
import { useTrainingData } from '../training-context';
import { createTrainingWord, selectTrainingWordSummaries } from '../training-model';
import { SESSION_PRESETS, calcLearnRestFromTotal } from '../session-config';
import type { SessionPresetKey } from '../session-config';
import type { AudioPitchTransform, TrainingAudioSourceType, TrainingSessionSettings } from '../training-types';

export interface SessionSelection {
  audioUri: string;
  label: string;
  presetKey?: string;
  sourceType: TrainingAudioSourceType;
  libraryEntryId: string;
}

export interface SaveSessionSetupResult {
  wordId: string;
  settings: TrainingSessionSettings;
  audioUri?: string | number;
  word: string;
}

export interface UseSessionSetupResult {
  presetKey: SessionPresetKey;
  setPresetKey: (key: SessionPresetKey) => void;
  sessionMins: number;
  setSessionMins: (n: number) => void;
  learnSecs: number;
  restSecs: number;
  totalCycles: number;
  isHydrated: boolean;
  trainingErrorMessage: string | null;
  saveErrorMessage: string | null;
  durationValidationError: string | null;
  isDurationValid: boolean;
  getSessionCountForLibraryEntry: (libraryEntryId: string) => number;
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

  const DEFAULT_PRESET_KEY: SessionPresetKey = 'medium';
  const _defaultPreset = SESSION_PRESETS.find((p) => p.key === DEFAULT_PRESET_KEY)!;

  const [presetKey, setPresetKeyState] = useState<SessionPresetKey>(DEFAULT_PRESET_KEY);
  const [sessionMins, setSessionMinsState] = useState(
    (_defaultPreset.learnSecs + _defaultPreset.restSecs) / 60 * _defaultPreset.cycles
  );
  const [learnSecs, setLearnSecs] = useState<number>(_defaultPreset.learnSecs);
  const [restSecs, setRestSecs] = useState<number>(_defaultPreset.restSecs);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  function setPresetKey(key: SessionPresetKey) {
    setPresetKeyState(key);
    if (key === 'custom') {
      const defaultMins = 25;
      setSessionMinsState(defaultMins);
      const { learnSecs: ls, restSecs: rs } = calcLearnRestFromTotal(defaultMins * 60);
      setLearnSecs(ls);
      setRestSecs(rs);
    } else {
      const preset = SESSION_PRESETS.find((p) => p.key === key)!;
      setLearnSecs(preset.learnSecs);
      setRestSecs(preset.restSecs);
      setSessionMinsState((preset.learnSecs + preset.restSecs) / 60 * preset.cycles);
    }
  }

  function setSessionMins(mins: number) {
    setSessionMinsState(mins);
    if (presetKey === 'custom') {
      const { learnSecs: ls, restSecs: rs } = calcLearnRestFromTotal(mins * 60);
      setLearnSecs(ls);
      setRestSecs(rs);
    }
  }

  const { totalCycles } = deriveSessionCycles({ totalSeconds: sessionMins * 60, learnSecs, restSecs });
  const isDurationValid = sessionMins > 0;
  const durationValidationError = isDurationValid ? null : t('sessionSetup.zeroDurationError');

  const wordSummaries = useMemo(
    () => (store ? selectTrainingWordSummaries(store) : []),
    [store]
  );

  function getSessionCountForLibraryEntry(libraryEntryId: string): number {
    // WordLibrary entry id로 그룹핑. 재녹음·라벨 수정과 무관하게 동일 entry의 모든 세션을 합산한다.
    // legacy TrainingWord snapshot은 libraryEntryId가 없어 0으로 잡혀 stale audioUri 그룹핑 문제를 회피.
    return wordSummaries
      .filter((s) => s.word.libraryEntryId === libraryEntryId)
      .reduce((sum, s) => sum + s.progress.sessionCount, 0);
  }

  async function saveSessionSetup(selection: SessionSelection): Promise<SaveSessionSetupResult | null> {
    if (!isHydrated) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return null;
    }
    if (!isDurationValid) {
      setSaveErrorMessage(t('sessionSetup.zeroDurationError'));
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
          libraryEntryId: selection.libraryEntryId,
        },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        sourceType: selection.sourceType,
        totalDurationSeconds: sessionMins * 60,
        wordId: word.id,
        libraryEntryId: selection.libraryEntryId,
      };
      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      return {
        wordId: word.id,
        settings,
        audioUri:
          selection.sourceType === 'recording'
            ? selection.audioUri
            : resolvePresetAudioModule(selection.presetKey) ?? undefined,
        word: selection.label,
      };
    } catch (error: unknown) {
      reportError(error, { scope: 'training.saveSessionSetup' });
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
    restSecs,
    totalCycles,
    isHydrated,
    trainingErrorMessage,
    saveErrorMessage,
    durationValidationError,
    isDurationValid,
    getSessionCountForLibraryEntry,
    saveSessionSetup,
  };
}
