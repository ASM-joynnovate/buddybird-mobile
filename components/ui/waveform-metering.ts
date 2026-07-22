// 정규화된 metering(0..1)을 파형 막대 높이로 변환하는 순수 계산부.
// WaveformPlaceholder(녹음 편집 카드)와 WaveformBars(녹음 생성 카드)가 공유해
// 마이크 입력 반응 파형의 계산 로직을 한곳에서 소유한다. 도형(막대 개수·픽셀 높이)은
// 소비 컴포넌트가 소유하고, 여기서는 0..1 정규화 값만 반환한다(geometry-agnostic).

// metering(0..1) 중 이 값 미만은 배경 잡음으로 간주. use-audio-recording 의 dB→0..1 정규화 기준.
export const WAVEFORM_NOISE_FLOOR = 0.25;

// 잡음 바닥을 제거하고 그 이상 구간을 0..1 로 재정규화한 유효 레벨.
export function meteringEffectiveLevel(metering: number): number {
  return metering < WAVEFORM_NOISE_FLOOR ? 0 : (metering - WAVEFORM_NOISE_FLOOR) / (1 - WAVEFORM_NOISE_FLOOR);
}

// 유효 레벨을 막대 index 별 0..1 목표 높이로 변환 — 가운데가 높은 가중 + 약한 지터.
export function meteringBarLevel(effective: number, index: number, barCount: number): number {
  const centreWeight = 1 - Math.abs(index - barCount / 2) / (barCount / 2);
  const jitter = (Math.random() - 0.5) * 0.35 * effective;
  return Math.max(0, Math.min(1, effective * centreWeight + jitter));
}
