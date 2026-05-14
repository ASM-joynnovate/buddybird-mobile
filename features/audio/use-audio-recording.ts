import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { persistRecordingFile } from './audio-file-storage';
import type { RecordingLifecycle, StableRecordingFile } from './audio-types';

const DB_FLOOR = -60;
const DB_CEIL = -10;

interface UseAudioRecordingResult {
  errorMessage: string | null;
  lifecycle: RecordingLifecycle;
  metering: number | null;
  recordingFile: StableRecordingFile | null;
  isRecording: boolean;
  requestAndStartRecording: () => Promise<void>;
  stopRecording: () => Promise<StableRecordingFile | null>;
  resetRecording: () => void;
}

interface UseAudioRecordingOptions {
  permissionDeniedMessage: string;
  saveFailedMessage: string;
  startFailedMessage: string;
  tooShortMessage?: string;
  maxDurationMs?: number;
}

export function useAudioRecording(options: UseAudioRecordingOptions): UseAudioRecordingResult {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const recorderStateRef = useRef(recorderState);
  recorderStateRef.current = recorderState;

  const [lifecycle, setLifecycle] = useState<RecordingLifecycle>('idle');
  const [recordingFile, setRecordingFile] = useState<StableRecordingFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestAndStartRecording = useCallback(async (): Promise<void> => {
    try {
      setLifecycle('requesting-permission');
      setErrorMessage(null);

      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();

      if (!permissionStatus.granted) {
        setLifecycle('error');
        setErrorMessage(options.permissionDeniedMessage);
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync({ isMeteringEnabled: true });
      audioRecorder.record();
      setRecordingFile(null);
      setLifecycle('recording');
    } catch {
      setLifecycle('error');
      setErrorMessage(options.startFailedMessage);
    }
  }, [audioRecorder, options.permissionDeniedMessage, options.startFailedMessage]);

  const stopRecording = useCallback(async (): Promise<StableRecordingFile | null> => {
    try {
      await audioRecorder.stop();

      if (!audioRecorder.uri) {
        setLifecycle('error');
        setErrorMessage(options.saveFailedMessage);
        return null;
      }

      const stableFile = await persistRecordingFile(audioRecorder.uri, new Date().toISOString());
      setRecordingFile(stableFile);
      setLifecycle('recorded');
      setErrorMessage(null);
      return stableFile;
    } catch {
      setLifecycle('error');
      setErrorMessage(options.saveFailedMessage);
      return null;
    }
  }, [audioRecorder, options.saveFailedMessage]);

  const resetRecording = useCallback((): void => {
    if (recorderStateRef.current.isRecording) {
      audioRecorder.stop().catch(() => {});
    }
    setLifecycle('idle');
    setRecordingFile(null);
    setErrorMessage(null);
  }, [audioRecorder]);

  useEffect(() => {
    if (!options.maxDurationMs || lifecycle !== 'recording') return;
    const id = setTimeout(() => { stopRecording(); }, options.maxDurationMs);
    return () => clearTimeout(id);
  }, [lifecycle, options.maxDurationMs, stopRecording]);

  const metering: number | null =
    recorderState.isRecording && recorderState.metering !== undefined
      ? Math.max(0, Math.min(1, (recorderState.metering - DB_FLOOR) / (DB_CEIL - DB_FLOOR)))
      : null;

  return {
    errorMessage,
    isRecording: recorderState.isRecording,
    lifecycle,
    metering,
    recordingFile,
    requestAndStartRecording,
    resetRecording,
    stopRecording,
  };
}
