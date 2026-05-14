import { useEffect, useMemo, useState } from 'react';

import type { AudioSourceChoice } from '@/features/audio/audio-types';
import { useAudioRecording } from '@/features/audio/hooks/use-audio-recording';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

import { type PersonaId } from '../session-config';
import { useTrainingData } from '../training-context';
import { createTrainingWord, selectTrainingWordSummaries } from '../training-model';
import type { AudioPitchTransform, TrainingAudioSourceType, TrainingSessionSettings } from '../training-types';

export interface UseSessionSetupResult {
  audioSource: AudioSourceChoice;
  setAudioSource: (next: AudioSourceChoice) => void;
  entries: WordEntry[];
  selectedEntryId: string | null;
  selectEntry: (id: string) => void;
  selectedEntry: WordEntry | undefined;
  sessionMins: number;
  setSessionMins: (n: number) => void;
  learnSecs: number;
  setLearnSecs: (n: number) => void;
  restSecs: number;
  setRestSecs: (n: number) => void;
  target: number;
  setTarget: (n: number) => void;
  persona: PersonaId;
  setPersona: (id: PersonaId) => void;
  recording: ReturnType<typeof useAudioRecording>;
  totalCycles: number;
  canContinue: boolean;
  isHydrated: boolean;
  isLibraryHydrated: boolean;
  trainingErrorMessage: string | null;
  saveErrorMessage: string | null;
  getEntrySessionCount: (entryId: string) => number;
  saveSessionSetup: () => Promise<{ wordId: string; settings: TrainingSessionSettings; audioUri?: string; word: string } | null>;
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
  const { entries, isHydrated: isLibraryHydrated } = useWordLibrary();

  const [audioSource, setAudioSource] = useState<AudioSourceChoice>('preset');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sessionMins, setSessionMins] = useState(20);
  const [learnSecs, setLearnSecs] = useState(60);
  const [restSecs, setRestSecs] = useState(30);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<PersonaId>('child');

  useEffect(() => {
    if (entries.length === 0) {
      if (selectedEntryId !== null) setSelectedEntryId(null);
      return;
    }
    if (selectedEntryId === null || !entries.some((e) => e.id === selectedEntryId)) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor((sessionMins * 60) / secsPerCycle));
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  const wordSummaries = useMemo(
    () => (store ? selectTrainingWordSummaries(store) : []),
    [store]
  );

  function getEntrySessionCount(entryId: string): number {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || !entry.presetKey) return 0;
    return wordSummaries
      .filter((s) => s.word.presetKey === entry.presetKey)
      .reduce((sum, s) => sum + s.progress.sessionCount, 0);
  }

  const canContinue =
    isHydrated &&
    isLibraryHydrated &&
    (
      (audioSource === 'preset' && selectedEntry !== undefined) ||
      (audioSource === 'recording' && recording.lifecycle === 'recorded' && recording.recordingFile !== null)
    );

  async function saveSessionSetup(): Promise<
    { wordId: string; settings: TrainingSessionSettings; audioUri?: string; word: string } | null
  > {
    if (!isHydrated || !isLibraryHydrated) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return null;
    }
    if (!canContinue) {
      setSaveErrorMessage(t('sessionSetup.selectAudioError'));
      return null;
    }
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso) as AudioPitchTransform;

      let audioUri: string;
      let label: string;
      let presetKey: string | undefined;
      let sourceType: TrainingAudioSourceType;

      if (audioSource === 'preset' && selectedEntry) {
        audioUri = selectedEntry.audioUri;
        label = selectedEntry.label;
        presetKey = selectedEntry.presetKey;
        sourceType = selectedEntry.sourceType;
      } else if (audioSource === 'recording' && recording.recordingFile) {
        audioUri = recording.recordingFile.uri;
        label = recording.recordingFile.fileName;
        presetKey = undefined;
        sourceType = 'recording';
      } else {
        setSaveErrorMessage(t('sessionSetup.selectAudioError'));
        return null;
      }

      const word = createTrainingWord(
        { audioUri, locale, label, presetKey, sourceType, pitchTransform },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        sourceType,
        totalDurationSeconds: sessionMins * 60,
        wordId: word.id,
      };
      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      return {
        wordId: word.id,
        settings,
        audioUri: sourceType === 'recording' ? audioUri : undefined,
        word: label,
      };
    } catch {
      setSaveErrorMessage(t('sessionSetup.saveError'));
      return null;
    }
  }

  return {
    audioSource,
    setAudioSource,
    entries,
    selectedEntryId,
    selectEntry: setSelectedEntryId,
    selectedEntry,
    sessionMins,
    setSessionMins,
    learnSecs,
    setLearnSecs,
    restSecs,
    setRestSecs,
    target,
    setTarget,
    persona,
    setPersona,
    recording,
    totalCycles,
    canContinue,
    isHydrated,
    isLibraryHydrated,
    trainingErrorMessage,
    saveErrorMessage,
    getEntrySessionCount,
    saveSessionSetup,
  };
}
