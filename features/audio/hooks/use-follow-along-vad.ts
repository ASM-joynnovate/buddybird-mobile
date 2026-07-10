import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { configurePlaybackAudioMode, configureRecordingAudioMode } from '../audio-mode';
import { persistRecordingFile } from '../audio-file-storage';
import type { StableRecordingFile } from '../audio-types';
import { createVadState, normalizeMetering, stepVad, type VadState } from '../vad-detector';
import { segmentMetering } from '../vad-segmentation';

export interface DetectedSegment {
  startMs: number;
  endMs: number;
}

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

interface UseFollowAlongVadInput {
  // 따라하기 무음 갭 동안에만 true. true 동안 녹음 + metering VAD 가동.
  enabled: boolean;
  // 발화가 감지된 갭의 녹음 파일이 저장되면 호출. segments 는 VAD로 분리한 발화 구간.
  onSaved?: (file: StableRecordingFile, segments: DetectedSegment[]) => void;
  // 갭 녹음을 멈추고 재생 모드를 복원한 직후 호출 — 학습 루프가 이 신호로 재생을 재개한다.
  // 녹음 정지 → 재생 모드 복원 → 재생 재개 순서를 보장해 레코더 teardown 과의 경쟁을 없앤다.
  onGapClosed?: () => void;
  // 값이 바뀌면 누적 감지 카운트를 초기화한다(회차 시작 시 reset 용도).
  resetKey?: number;
}

interface UseFollowAlongVadResult {
  voiceActive: boolean;
  detectionCount: number;
  permissionDenied: boolean;
}

export function useFollowAlongVad({ enabled, onSaved, onGapClosed, resetKey }: UseFollowAlongVadInput): UseFollowAlongVadResult {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 100);

  const [voiceActive, setVoiceActive] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const vadStateRef = useRef<VadState>(createVadState());
  // 이번 갭 윈도우에서 발화가 한 번이라도 감지됐는지 — 저장 여부 판단용.
  const detectedInWindowRef = useRef(false);
  // 이번 갭 녹음의 정규화 metering 타임라인(100ms 간격) — 저장 시 발화 구간 분할에 사용.
  const meteringSamplesRef = useRef<number[]>([]);
  const latestMeteringRef = useRef(0);

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const onGapClosedRef = useRef(onGapClosed);
  onGapClosedRef.current = onGapClosed;

  // 회차 시작 등 resetKey 변경 시 누적 감지 카운트 초기화.
  useEffect(() => {
    setDetectionCount(0);
    setVoiceActive(false);
    vadStateRef.current = createVadState();
  }, [resetKey]);

  // 녹음 시작/정지: enabled 동안만 파일 녹음(+ metering). 종료 시 발화가 있었으면 파일 저장.
  // playback 모드 복귀는 학습 루프가 단독 소유 → 여기선 stop 만.
  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;

    vadStateRef.current = createVadState();
    detectedInWindowRef.current = false;
    meteringSamplesRef.current = [];
    latestMeteringRef.current = 0;

    // metering 값이 동일해도 누락 없이 고정 100ms cadence 로 타임라인 수집.
    const samplingTimer = setInterval(() => {
      meteringSamplesRef.current.push(latestMeteringRef.current);
    }, 100);

    (async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          setPermissionDenied(true);
          return;
        }
        if (isCancelled) return;
        await configureRecordingAudioMode();
        await recorder.prepareToRecordAsync();
        if (isCancelled) return;
        recorder.record();
      } catch (error: unknown) {
        reportError(error, { scope: 'audio.followAlongVad.start' });
      }
    })();

    return () => {
      isCancelled = true;
      clearInterval(samplingTimer);
      setVoiceActive(false);
      const shouldSave = detectedInWindowRef.current;
      const samples = meteringSamplesRef.current;
      vadStateRef.current = createVadState();
      detectedInWindowRef.current = false;

      (async () => {
        // uri 읽기도 try 안에 있어야 한다: 언마운트 시 useAudioRecorder 가 네이티브 객체를
        // 먼저 release 하면 sync getter(recorder.uri)가 NativeSharedObjectNotFound 로 던진다.
        let uri: string | null = null;
        try {
          await recorder.stop();
          uri = recorder.uri;
        } catch (error: unknown) {
          // 갭 종료/언마운트 시점 — playback 모드 전환과 겹쳐 나는 경고는 비치명적.
          reportError(error, { scope: 'audio.followAlongVad.stop' });
        }
        // record 모드로 바꾼 주체가 되돌린다: 정지 직후 playback 모드를 복원하고, 그 다음
        // 학습 루프에 갭 종료를 알려 재생을 재개시킨다. stop 실패와 무관하게 반드시 실행해
        // 루프가 멈추지 않게 한다(복원 → 재개 순서 보장으로 무음 버그 방지).
        try {
          await configurePlaybackAudioMode();
        } catch (error: unknown) {
          reportError(error, { scope: 'audio.followAlongVad.restorePlayback' });
        }
        onGapClosedRef.current?.();
        if (shouldSave && uri) {
          try {
            const file = await persistRecordingFile(uri, new Date().toISOString());
            const segments = segmentMetering(samples).map(({ startMs, endMs }) => ({ startMs, endMs }));
            onSavedRef.current?.(file, segments);
          } catch (error: unknown) {
            reportError(error, { scope: 'audio.followAlongVad.persist' });
          }
        }
      })();
    };
  }, [enabled, recorder]);

  // metering 폴링 → 임계값 sustain/release 로 발화 onset 카운트.
  useEffect(() => {
    if (!enabled || !recorderState.isRecording || recorderState.metering === undefined) return;
    const normalized = normalizeMetering(recorderState.metering);
    latestMeteringRef.current = normalized;

    const transition = stepVad(vadStateRef.current, normalized);
    if (transition === 'onset') {
      detectedInWindowRef.current = true;
      setVoiceActive(true);
      setDetectionCount((count) => count + 1);
    } else if (transition === 'release') {
      setVoiceActive(false);
    }
  }, [enabled, recorderState.isRecording, recorderState.metering]);

  return { voiceActive, detectionCount, permissionDenied };
}
