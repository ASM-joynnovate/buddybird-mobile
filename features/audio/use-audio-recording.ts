import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useState } from 'react';

import { persistRecordingFile } from './audio-file-storage';
import type { RecordingLifecycle, StableRecordingFile } from './audio-types';

interface UseAudioRecordingResult {
  errorMessage: string | null;
  lifecycle: RecordingLifecycle;
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
}

export function useAudioRecording(options: UseAudioRecordingOptions): UseAudioRecordingResult {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
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
      await audioRecorder.prepareToRecordAsync();
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
    setLifecycle('idle');
    setRecordingFile(null);
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    isRecording: recorderState.isRecording,
    lifecycle,
    recordingFile,
    requestAndStartRecording,
    resetRecording,
    stopRecording,
  };
}
