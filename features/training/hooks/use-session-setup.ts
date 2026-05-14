import { useMemo, useState } from 'react';

import type { AudioSourceChoice } from '@/features/audio/audio-types';
import { useAudioRecording } from '@/features/audio/hooks/use-audio-recording';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';

import { PRESET_WORDS, type PersonaId } from '../session-config';
import { useTrainingData } from '../training-context';
import { createTrainingWord, selectTrainingWordSummaries } from '../training-model';
import type { AudioPitchTransform, TrainingAudioSourceType, TrainingSessionSettings } from '../training-types';

export interface UseSessionSetupResult {
  audioSource: AudioSourceChoice;
  setAudioSource: (next: AudioSourceChoice) => void;
  selectedPresetKey: string;
  setSelectedPresetKey: (key: string) => void;
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
  selectedPreset: typeof PRESET_WORDS[number];
  canContinue: boolean;
  isHydrated: boolean;
  trainingErrorMessage: string | null;
  saveErrorMessage: string | null;
  getPresetSessionCount: (key: string) => number;
  saveSessionSetup: () => Promise<{ wordId: string; settings: TrainingSessionSettings; audioUri?: string } | null>;
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

  const [audioSource, setAudioSource] = useState<AudioSourceChoice>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('hello');
  const [sessionMins, setSessionMins] = useState(20);
  const [learnSecs, setLearnSecs] = useState(60);
  const [restSecs, setRestSecs] = useState(30);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<PersonaId>('child');

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor((sessionMins * 60) / secsPerCycle));
  const selectedPreset = PRESET_WORDS.find((p) => p.key === selectedPresetKey) ?? PRESET_WORDS[0];

  const wordSummaries = useMemo(
    () => (store ? selectTrainingWordSummaries(store) : []),
    [store]
  );

  function getPresetSessionCount(presetKey: string): number {
    return wordSummaries
      .filter((s) => s.word.presetKey === presetKey)
      .reduce((sum, s) => sum + s.progress.sessionCount, 0);
  }

  const canContinue =
    isHydrated &&
    (audioSource === 'preset' ||
      (audioSource === 'recording' && recording.lifecycle === 'recorded' && recording.recordingFile !== null));

  async function saveSessionSetup(): Promise<
    { wordId: string; settings: TrainingSessionSettings; audioUri?: string } | null
  > {
    if (!isHydrated) {
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

      if (audioSource === 'preset') {
        audioUri = `preset://${selectedPreset.word}`;
        label = selectedPreset.word;
        presetKey = selectedPreset.key;
        sourceType = 'preset';
      } else {
        audioUri = recording.recordingFile!.uri;
        label = recording.recordingFile!.fileName;
        presetKey = undefined;
        sourceType = 'recording';
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
      };
    } catch {
      setSaveErrorMessage(t('sessionSetup.saveError'));
      return null;
    }
  }

  return {
    audioSource,
    setAudioSource,
    selectedPresetKey,
    setSelectedPresetKey,
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
    selectedPreset,
    canContinue,
    isHydrated,
    trainingErrorMessage,
    saveErrorMessage,
    getPresetSessionCount,
    saveSessionSetup,
  };
}
