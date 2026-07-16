// 실시간 metering VAD 의 순수 판정부. 100ms 폴링 1샘플씩 상태를 전진시킨다.
// 네이티브 SessionAudioEngine에도 같은 초기 임계값을 전달한다.
// AEC 미사용 — 재생과 녹음이 겹치는 구간에서는 쓰지 않는다.

// metering(dB)을 0..1로 정규화하는 범위 — use-audio-recording 과 동일 기준.
const VAD_DB_FLOOR = -60;
const VAD_DB_CEIL = -10;

// 경량 VAD 튜닝값 (100ms 폴링 기준). 실기기에서 마이크 게인에 맞춰 조정.
export const VAD_THRESHOLD = 0.35; // 정규화 진폭 임계값
export const VAD_SUSTAIN_SAMPLES = 3; // 연속 초과 샘플 수 → 발화 onset (≈300ms)
export const VAD_RELEASE_SAMPLES = 5; // 연속 미만 샘플 수 → 발화 종료 (≈500ms)

export interface VadState {
  aboveRun: number;
  belowRun: number;
  isVoice: boolean;
}

export type VadTransition = 'onset' | 'release' | null;

export function normalizeMetering(db: number): number {
  return Math.max(0, Math.min(1, (db - VAD_DB_FLOOR) / (VAD_DB_CEIL - VAD_DB_FLOOR)));
}

export function createVadState(): VadState {
  return { aboveRun: 0, belowRun: 0, isVoice: false };
}

// 샘플 하나를 반영해 state 를 제자리에서 전진시키고, 경계를 넘었으면 전이를 반환한다.
// 임계 초과 샘플에서 belowRun 이 0으로 리셋되므로, 발화가 시작되는 틱에서는
// 무음 카운터 기반 동작(예: 롤링 레코더의 무음 롤)이 절대 개시되지 않는다.
export function stepVad(state: VadState, normalized: number): VadTransition {
  if (normalized >= VAD_THRESHOLD) {
    state.aboveRun += 1;
    state.belowRun = 0;
  } else {
    state.belowRun += 1;
    state.aboveRun = 0;
  }

  if (!state.isVoice && state.aboveRun >= VAD_SUSTAIN_SAMPLES) {
    state.isVoice = true;
    return 'onset';
  }
  if (state.isVoice && state.belowRun >= VAD_RELEASE_SAMPLES) {
    state.isVoice = false;
    return 'release';
  }
  return null;
}
