// metering amplitude 타임라인(0..1, 100ms 간격)을 발화 구간으로 쪼개는 순수 VAD util.
// 침묵/에너지 텀 기준 분할이며 음향적 노이즈 분류가 아니다. 임계/sustain/release 기준은
// use-follow-along-vad.ts 의 실시간 감지와 유사하다.

const SAMPLE_MS = 100;

export interface VadSegment {
  id: string;
  startMs: number;
  endMs: number;
  // 막대 렌더용 다운샘플 amplitude(0..1).
  peaks: number[];
}

export interface SegmentMeteringOptions {
  // 절대 임계값을 강제하려면 지정. 미지정 시 녹음별 noise-floor↔peak 로 적응형 계산.
  threshold?: number;
  thresholdRatio?: number; // 적응형 임계 위치: floor + ratio*(peak-floor)
  minRange?: number; // floor↔peak 대비가 이보다 작으면 분할 불가로 간주
  sustainSamples?: number; // 연속 초과 샘플 수 → 발화 onset
  releaseSamples?: number; // 연속 미만 샘플 수 → 발화 종료
  minSegmentMs?: number; // 이보다 짧은 구간은 블립으로 제거
  peakBars?: number; // 세그먼트당 막대 개수
}

const DEFAULTS = {
  thresholdRatio: 0.4,
  minRange: 0.12,
  sustainSamples: 2, // ≈200ms
  releaseSamples: 3, // ≈300ms 텀이면 분할
  minSegmentMs: 200,
  peakBars: 20,
};

export function segmentMetering(samples: number[], options?: SegmentMeteringOptions): VadSegment[] {
  const { threshold, thresholdRatio, minRange, sustainSamples, releaseSamples, minSegmentMs, peakBars } = {
    ...DEFAULTS,
    ...options,
  };

  // 노이즈 floor 대비 peak 가 충분히 떨어져야 발화/침묵을 가른다.
  // 절대 임계값(threshold)이 주어지면 그대로, 아니면 녹음별 동적 범위로 적응형 계산.
  const floor = percentile(samples, 0.15);
  const peak = percentile(samples, 0.95);
  if (threshold === undefined && peak - floor < minRange) {
    // 동적 범위가 거의 없음 → 침묵/말 구분 불가. 분할하지 않음.
    return [];
  }
  const effectiveThreshold = threshold ?? floor + thresholdRatio * (peak - floor);

  const ranges: { startIdx: number; endIdx: number }[] = [];
  let inVoice = false;
  let aboveRun = 0;
  let belowRun = 0;
  let startIdx = 0;

  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i] >= effectiveThreshold) {
      aboveRun += 1;
      belowRun = 0;
    } else {
      belowRun += 1;
      aboveRun = 0;
    }

    if (!inVoice && aboveRun >= sustainSamples) {
      inVoice = true;
      startIdx = i - sustainSamples + 1;
    } else if (inVoice && belowRun >= releaseSamples) {
      inVoice = false;
      ranges.push({ startIdx, endIdx: i - releaseSamples + 1 });
    }
  }

  if (inVoice) {
    ranges.push({ startIdx, endIdx: samples.length });
  }

  return ranges
    .map(({ startIdx: s, endIdx: e }) => ({
      id: `seg-${s * SAMPLE_MS}`,
      startMs: s * SAMPLE_MS,
      endMs: e * SAMPLE_MS,
      peaks: downsample(samples.slice(s, e), peakBars),
    }))
    .filter((segment) => segment.endMs - segment.startMs >= minSegmentMs);
}

// 정렬 기반 백분위수 (0..1). 빈 배열은 0.
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

// 구간 amplitude 를 막대 개수만큼 버킷 평균으로 다운샘플. 빈 구간은 0 배열.
function downsample(values: number[], bars: number): number[] {
  if (values.length === 0) return new Array(bars).fill(0);
  const result: number[] = [];
  for (let b = 0; b < bars; b += 1) {
    const from = Math.floor((b * values.length) / bars);
    const to = Math.max(from + 1, Math.floor(((b + 1) * values.length) / bars));
    let sum = 0;
    for (let i = from; i < to; i += 1) sum += values[i];
    result.push(sum / (to - from));
  }
  return result;
}
