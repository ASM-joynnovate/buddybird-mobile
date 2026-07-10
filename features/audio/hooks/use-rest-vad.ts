import { AudioModule, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { configurePlaybackAudioMode, configureRecordingAudioMode } from '../audio-mode';
import { deleteRecordingFile, persistRecordingFile } from '../audio-file-storage';
import type { DetectedSegment, StableRecordingFile } from '../audio-types';
import { ROLL_SILENCE_SAMPLES, VAD_RECORDING_OPTIONS } from '../vad-config';
import { createVadState, normalizeMetering, stepVad, type VadState } from '../vad-detector';
import { segmentMetering } from '../vad-segmentation';

// metering 폴링 간격. vad-detector 의 sustain/release 샘플 수와 ROLL_SILENCE_SAMPLES 가 이 값을 전제한다.
const SAMPLE_INTERVAL_MS = 100;

interface UseRestVadInput {
  // 휴식 phase 동안에만 true. true 인 동안 롤링 녹음 + metering VAD 가동.
  enabled: boolean;
  // 발화 한 건이 파일로 확정될 때마다 호출. segments 는 그 파일 안에서의 발화 구간.
  onSaved?: (file: StableRecordingFile, segments: DetectedSegment[]) => void;
}

interface UseRestVadResult {
  permissionDenied: boolean;
}

// 휴식 구간 발화를 "발화 1회 = 파일 1개" 로 캡처한다.
//
// expo-audio 는 record()~stop() 사이클당 파일 하나만 만들고 링버퍼가 없다. 반면 발화 onset 은
// 시작 300ms 뒤(sustain 3샘플)에야 확정되므로, 레코더는 발화가 시작될 때 이미 돌고 있어야 앞부분을
// 잃지 않는다. 그래서 휴식 내내 녹음하되 청크를 갈아끼운다:
//   - 무음이 ROLL_SILENCE_SAMPLES 만큼 이어지면 청크를 버리고 새로 시작(선행 무음 상한)
//   - 발화가 끝나면(release) 그 청크를 파일로 확정
// 휴식 중에는 재생이 없으므로 롤은 오디오 모드를 건드리지 않는다. record 모드 진입은 시작 시 한 번,
// playback 모드 복원은 teardown 에서 한 번.
//
// 세션 배선은 useRestPhraseCapture 를 소비하세요 — 이 훅을 화면에서 직접 들지 않습니다.
export function useRestVad({ enabled, onSaved }: UseRestVadInput): UseRestVadResult {
  const recorder = useAudioRecorder(VAD_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, SAMPLE_INTERVAL_MS);

  const [permissionDenied, setPermissionDenied] = useState(false);

  const vadStateRef = useRef<VadState>(createVadState());
  // 현재 청크에서 발화가 한 번이라도 감지됐는지 — 확정 저장 여부 판단용.
  const detectedInChunkRef = useRef(false);
  // 현재 청크의 정규화 metering 타임라인(100ms 간격). 청크 파일의 t=0 기준이라 분할에 그대로 쓴다.
  const chunkSamplesRef = useRef<number[]>([]);
  const latestMeteringRef = useRef(0);
  const isRecordingRef = useRef(false);
  const isRollingRef = useRef(false);
  // 시작·롤·teardown 을 한 줄로 직렬화한다. teardown 의 stop 이 진행 중인 롤/시작의 record() 뒤에
  // 오도록 보장해, 레코더가 teardown 이후 되살아나 마이크가 켜진 채 남는 것을 막는다.
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  // 판정은 아래 고정 인터벌이 수행하고, 이 이펙트는 최신 metering 을 ref 로 옮기기만 한다.
  // metering 값이 폴링 간 동일하면 deps 가 같아 이 이펙트는 재실행되지 않는다. 여기서 카운터를
  // 전진시키면 무음 중 belowRun 이 멈춰 무음 롤이 영영 걸리지 않는다.
  useEffect(() => {
    isRecordingRef.current = recorderState.isRecording;
    if (recorderState.metering !== undefined) {
      latestMeteringRef.current = normalizeMetering(recorderState.metering);
    }
  }, [recorderState.isRecording, recorderState.metering]);

  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;
    // record 모드로 전환했는지 — teardown 이 stop/모드복원을 해야 하는지 판단한다.
    let isArmed = false;

    vadStateRef.current = createVadState();
    detectedInChunkRef.current = false;
    chunkSamplesRef.current = [];
    latestMeteringRef.current = 0;
    isRecordingRef.current = false;
    isRollingRef.current = false;

    function toSegments(samples: number[]): DetectedSegment[] {
      return segmentMetering(samples).map(({ startMs, endMs }) => ({ startMs, endMs }));
    }

    // 청크 교체. 새 녹음을 시작하기 전에 직전 파일을 처리한다 — prepareToRecordAsync 가 같은 임시
    // 경로를 재사용할 수 있어, 복사/삭제를 restart 뒤로 미루면 새 녹음을 건드릴 위험이 있다.
    // 롤은 무음 구간에서만 일어나므로 이 사이에 잃는 오디오는 무음이다.
    async function runRoll(persist: boolean): Promise<void> {
      if (isCancelled || !isArmed) return;

      const samples = chunkSamplesRef.current;
      chunkSamplesRef.current = [];
      detectedInChunkRef.current = false;
      vadStateRef.current = createVadState();

      let uri: string | null = null;
      try {
        await recorder.stop();
        // uri 는 sync getter — 네이티브 객체가 먼저 release 되면 던진다(BB-157).
        uri = recorder.uri;
      } catch (error: unknown) {
        reportError(error, { scope: 'audio.restVad.stop' });
      }

      let saved: StableRecordingFile | null = null;
      if (uri) {
        if (persist) {
          try {
            saved = await persistRecordingFile(uri, new Date().toISOString());
          } catch (error: unknown) {
            reportError(error, { scope: 'audio.restVad.persist' });
          }
        }
        deleteRecordingFile(uri);
      }

      if (!isCancelled) {
        try {
          await recorder.prepareToRecordAsync();
          if (!isCancelled) recorder.record();
        } catch (error: unknown) {
          reportError(error, { scope: 'audio.restVad.roll' });
        }
      }

      if (saved) onSavedRef.current?.(saved, toSegments(samples));
    }

    function scheduleRoll(persist: boolean): void {
      if (isRollingRef.current || isCancelled || !isArmed) return;
      isRollingRef.current = true;
      chainRef.current = chainRef.current
        .catch(() => {})
        .then(() => runRoll(persist))
        .finally(() => {
          isRollingRef.current = false;
        });
    }

    chainRef.current = chainRef.current.catch(() => {}).then(async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          setPermissionDenied(true);
          return;
        }
        if (isCancelled) return;
        // 모드 전환이 중간에 실패해도 teardown 이 playback 을 복원하도록 먼저 세운다.
        isArmed = true;
        await configureRecordingAudioMode();
        await recorder.prepareToRecordAsync();
        if (isCancelled) return;
        recorder.record();
      } catch (error: unknown) {
        reportError(error, { scope: 'audio.restVad.start' });
      }
    });

    // metering 값이 같아도 누락 없이 고정 100ms cadence 로 판정하고 타임라인을 수집한다.
    // 녹음이 도는 동안에만 샘플을 밀어넣어야 타임라인이 파일 내용과 1:1 로 맞는다.
    const timer = setInterval(() => {
      if (isCancelled || isRollingRef.current || !isRecordingRef.current) return;

      const normalized = latestMeteringRef.current;
      chunkSamplesRef.current.push(normalized);

      const transition = stepVad(vadStateRef.current, normalized);
      if (transition === 'onset') {
        detectedInChunkRef.current = true;
        return;
      }
      if (transition === 'release') {
        scheduleRoll(true);
        return;
      }

      // 발화 없이 무음만 길게 이어지면 청크를 버려 선행 무음을 잘라낸다.
      const { isVoice, belowRun } = vadStateRef.current;
      if (!isVoice && belowRun >= ROLL_SILENCE_SAMPLES) scheduleRoll(false);
    }, SAMPLE_INTERVAL_MS);

    return () => {
      isCancelled = true;
      clearInterval(timer);
      const shouldSave = detectedInChunkRef.current;
      const samples = chunkSamplesRef.current;
      chunkSamplesRef.current = [];
      detectedInChunkRef.current = false;
      isRecordingRef.current = false;
      vadStateRef.current = createVadState();

      // 진행 중인 시작/롤 뒤에 이어 붙여, 그것들이 레코더를 되살린 뒤에 정지하도록 한다.
      chainRef.current = chainRef.current.catch(() => {}).then(async () => {
        if (!isArmed) return;
        let uri: string | null = null;
        try {
          await recorder.stop();
          uri = recorder.uri;
        } catch (error: unknown) {
          // 휴식 종료/언마운트 시점 — 모드 전환과 겹쳐 나는 경고는 비치명적.
          reportError(error, { scope: 'audio.restVad.stop' });
        }
        // record 모드로 바꾼 주체가 되돌린다. stop 실패와 무관하게 반드시 실행해
        // 다음 학습 phase 의 재생이 record 모드에 갇히지 않게 한다.
        try {
          await configurePlaybackAudioMode();
        } catch (error: unknown) {
          reportError(error, { scope: 'audio.restVad.restorePlayback' });
        }
        if (!uri) return;
        // 휴식이 끝나는 순간 진행 중이던 발화도 잃지 않는다.
        let saved: StableRecordingFile | null = null;
        if (shouldSave) {
          try {
            saved = await persistRecordingFile(uri, new Date().toISOString());
          } catch (error: unknown) {
            reportError(error, { scope: 'audio.restVad.persist' });
          }
        }
        deleteRecordingFile(uri);
        if (saved) onSavedRef.current?.(saved, toSegments(samples));
      });
    };
  }, [enabled, recorder]);

  return { permissionDenied };
}
