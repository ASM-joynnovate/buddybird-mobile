import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { sessionAudioEngine } from '@/modules/session-audio-engine';

import { configurePlaybackAudioMode, configureRecordingAudioMode } from '../audio-mode';
import { persistRecordingFile } from '../audio-file-storage';
import type { RecordingLifecycle, StableRecordingFile } from '../audio-types';

const DB_FLOOR = -60;
const DB_CEIL = -10;
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};
// 네이티브 학습 세션이 마이크를 쥐고 있는 상태. training-context 의 "세션 진행 중" 판정과 같은 집합을 쓴다.
const MIC_HOLDING_SESSION_STATES = ['starting', 'running', 'paused', 'interrupted'];

// 학습 세션이 마이크를 점유 중이면 단어 녹음을 시작할 수 없다.
// 판정 자체가 실패하면 차단하지 않는다(fail open) — 조회 실패로 정상 녹음을 막는 쪽이 더 나쁘다.
async function isTrainingSessionHoldingMic(): Promise<boolean> {
  try {
    const snapshot = await sessionAudioEngine.getSnapshot();
    return snapshot !== null && MIC_HOLDING_SESSION_STATES.includes(snapshot.state);
  } catch (error: unknown) {
    console.warn('[audio.sessionGate]', error);
    return false;
  }
}

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
  blockedBySessionMessage: string;
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

      // 권한 요청·오디오 모드 전환보다 먼저 막는다. 실패가 뻔한 시도로 공유 오디오 세션을 흔들면
      // 백그라운드로 재생 중인 학습 세션까지 영향을 받는다.
      if (await isTrainingSessionHoldingMic()) {
        setLifecycle('error');
        setErrorMessage(options.blockedBySessionMessage);
        return;
      }

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
  }, [audioRecorder, options.blockedBySessionMessage, options.permissionDeniedMessage, options.startFailedMessage]);

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
