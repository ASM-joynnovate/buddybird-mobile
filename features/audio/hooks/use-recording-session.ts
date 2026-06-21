import { useCallback, useMemo } from 'react';

import { useAudioPreview } from './use-audio-preview';
import { useAudioRecording } from './use-audio-recording';
import type { RecordingLifecycle, StableRecordingFile } from '../audio-types';

// 녹음 lifecycle·metering·파일 영속·상태→라벨 매핑을 한곳에 합성하는 seam.
// 단어 생성/편집 모달은 useAudioRecording + useAudioPreview 를 직접 들고 명령형으로
// 조율하지 않고 이 seam 하나만 소비한다. "녹음 중·재생 가능·재설정 가능" 개념을 여기 모은다.
// 오디오 소스 정규화/preset 해석은 #09 audio-source-resolver 의 책임이며 여기서 재구현하지 않는다.
// (신규 녹음은 절대 URI, 기존 entry 소스는 호출부가 해석해 넘긴다.)

// 상태→라벨 매핑 입력. 라벨 문자열·시간 포맷은 화면마다 다르므로 화면이 주입하고,
// "어떤 상태에 어떤 라벨을 쓸지"의 분기 판단만 seam 이 한 번 소유한다.
export interface RecordingStatusLabels {
  ready?: string;
  requestingPermission?: string;
  recording: (recordingElapsedSeconds: number) => string;
  recorded: (playbackElapsedSeconds: number, isPlaying: boolean) => string;
  error?: string;
}

export interface RecordingSessionPlayback {
  isPlaying: boolean;
  elapsedSeconds: number;
  canPlay: boolean;
  play: () => Promise<void>;
  stop: () => void;
}

export interface RecordingSession {
  state: RecordingLifecycle;
  metering: number | null;
  file: StableRecordingFile | null;
  elapsedSeconds: number;
  errorMessage: string | null;
  actions: {
    start: () => Promise<void>;
    stop: () => Promise<StableRecordingFile | null>;
    reset: () => void;
  };
  // 새로 녹음한 파일 미리듣기.
  playback: RecordingSessionPlayback;
  // 이미 저장된 entry 재생(편집 모달용). existingSource 미지정 시 disabled.
  entryPlayback: RecordingSessionPlayback;
  ui: {
    statusLabel: string | undefined;
    isRecording: boolean;
    canPlayback: boolean;
  };
}

interface UseRecordingSessionOptions {
  messages: { permissionDenied: string; saveFailed: string; startFailed: string };
  statusLabels: RecordingStatusLabels;
  maxDurationMs?: number;
  // 이미 저장된 entry 의 재생 소스(편집 모달). 신규 녹음과 상호 배타로 조율된다.
  existingSource?: string | number | null;
  existingPlaybackRate?: number;
  existingDurationSeconds?: number;
}

export function useRecordingSession(options: UseRecordingSessionOptions): RecordingSession {
  const recording = useAudioRecording({
    permissionDeniedMessage: options.messages.permissionDenied,
    saveFailedMessage: options.messages.saveFailed,
    startFailedMessage: options.messages.startFailed,
    maxDurationMs: options.maxDurationMs,
  });

  const recordedPreview = useAudioPreview(recording.recordingFile?.uri ?? null, 1, recording.elapsedSeconds);
  const entryPreview = useAudioPreview(
    options.existingSource ?? null,
    options.existingPlaybackRate ?? 1,
    options.existingDurationSeconds,
  );

  // 하위 훅들의 콜백은 useCallback 으로 안정적이다. 객체 전체가 아니라 콜백만 deps 에 두어
  // start/reset/playback 의 식별자 안정성을 보존한다(소비처 useEffect 가 매 렌더 재실행되지 않도록).
  const { requestAndStartRecording, stopRecording, resetRecording } = recording;
  const { playPreview: playRecorded, stopPreview: stopRecorded } = recordedPreview;
  const { playPreview: playEntry, stopPreview: stopEntry } = entryPreview;

  const start = useCallback(async (): Promise<void> => {
    stopRecorded();
    stopEntry();
    await requestAndStartRecording();
  }, [requestAndStartRecording, stopEntry, stopRecorded]);

  const reset = useCallback((): void => {
    stopRecorded();
    stopEntry();
    resetRecording();
  }, [resetRecording, stopEntry, stopRecorded]);

  const statusLabel = resolveStatusLabel({
    lifecycle: recording.lifecycle,
    labels: options.statusLabels,
    recordingElapsedSeconds: recording.elapsedSeconds,
    playbackElapsedSeconds: recordedPreview.elapsedSeconds,
    isPlaybackPlaying: recordedPreview.previewState === 'playing',
  });

  const playback: RecordingSessionPlayback = useMemo(
    () => ({
      isPlaying: recordedPreview.previewState === 'playing',
      elapsedSeconds: recordedPreview.elapsedSeconds,
      canPlay: recordedPreview.canPreview,
      play: playRecorded,
      stop: stopRecorded,
    }),
    [recordedPreview.previewState, recordedPreview.elapsedSeconds, recordedPreview.canPreview, playRecorded, stopRecorded],
  );

  const entryPlayback: RecordingSessionPlayback = useMemo(
    () => ({
      isPlaying: entryPreview.previewState === 'playing',
      elapsedSeconds: entryPreview.elapsedSeconds,
      canPlay: entryPreview.canPreview,
      play: playEntry,
      stop: stopEntry,
    }),
    [entryPreview.previewState, entryPreview.elapsedSeconds, entryPreview.canPreview, playEntry, stopEntry],
  );

  return useMemo(
    () => ({
      state: recording.lifecycle,
      metering: recording.metering,
      file: recording.recordingFile,
      elapsedSeconds: recording.elapsedSeconds,
      errorMessage: recording.errorMessage,
      actions: { start, stop: stopRecording, reset },
      playback,
      entryPlayback,
      ui: {
        statusLabel,
        isRecording: recording.isRecording,
        canPlayback: recording.lifecycle === 'recorded' && recording.recordingFile !== null,
      },
    }),
    [
      recording.lifecycle,
      recording.metering,
      recording.recordingFile,
      recording.elapsedSeconds,
      recording.errorMessage,
      recording.isRecording,
      start,
      stopRecording,
      reset,
      playback,
      entryPlayback,
      statusLabel,
    ],
  );
}

function resolveStatusLabel({
  lifecycle,
  labels,
  recordingElapsedSeconds,
  playbackElapsedSeconds,
  isPlaybackPlaying,
}: {
  lifecycle: RecordingLifecycle;
  labels: RecordingStatusLabels;
  recordingElapsedSeconds: number;
  playbackElapsedSeconds: number;
  isPlaybackPlaying: boolean;
}): string | undefined {
  switch (lifecycle) {
    case 'recording':
      return labels.recording(recordingElapsedSeconds);
    case 'recorded':
      return labels.recorded(playbackElapsedSeconds, isPlaybackPlaying);
    case 'requesting-permission':
      return labels.requestingPermission;
    case 'error':
      return labels.error ?? labels.ready;
    default:
      return labels.ready;
  }
}
