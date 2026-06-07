import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { configurePlaybackAudioMode, configureRecordingAudioMode } from '../audio-mode';
import { persistRecordingFile } from '../audio-file-storage';
import type { RecordingLifecycle, StableRecordingFile } from '../audio-types';

const DB_FLOOR = -60;
const DB_CEIL = -10;
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

interface UseAudioRecordingResult {
  errorMessage: string | null;
  elapsedSeconds: number;
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
  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const recorderStateRef = useRef(recorderState);
  recorderStateRef.current = recorderState;

  const [lifecycle, setLifecycle] = useState<RecordingLifecycle>('idle');
  const [recordingFile, setRecordingFile] = useState<StableRecordingFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

      await configureRecordingAudioMode();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordingFile(null);
      setLifecycle('recording');
    } catch (error: unknown) {
      reportError(error, { scope: 'audio.requestAndStartRecording' });
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
      await configurePlaybackAudioMode();
      setRecordingFile(stableFile);
      setLifecycle('recorded');
      setErrorMessage(null);
      return stableFile;
    } catch (error: unknown) {
      reportError(error, { scope: 'audio.stopRecording' });
      setLifecycle('error');
      setErrorMessage(options.saveFailedMessage);
      return null;
    }
  }, [audioRecorder, options.saveFailedMessage]);

  const resetRecording = useCallback((): void => {
    if (recorderStateRef.current.isRecording) {
      audioRecorder.stop().catch((error: unknown) => {
        reportError(error, { scope: 'audio.resetRecording.stop' });
      });
    }
    configurePlaybackAudioMode().catch((error: unknown) => {
      reportError(error, { scope: 'audio.resetRecording.playbackMode' });
    });
    setLifecycle('idle');
    setRecordingFile(null);
    setErrorMessage(null);
  }, [audioRecorder]);

  useEffect(() => {
    if (lifecycle !== 'recording') return;
    setElapsedSeconds(0);
    const id = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [lifecycle]);

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
    elapsedSeconds,
    isRecording: recorderState.isRecording,
    lifecycle,
    metering,
    recordingFile,
    requestAndStartRecording,
    resetRecording,
    stopRecording,
  };
}
