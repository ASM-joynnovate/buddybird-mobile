import { reportError } from '@/features/analytics/error-reporter';
import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

export const WORD_METRICS_STORAGE_KEY = '@buddybird/analytics-word-metrics';

export interface WordLifetimeMetrics {
  word_id: string;
  word_name: string;
  lifetime_practice_count: number;
  lifetime_practice_duration_ms: number;
  lifetime_recording_count: number;
  last_practiced_at_iso: string;
}

export interface WordSessionDelta {
  word_id: string;
  word_name: string;
  practice_duration_ms: number;
  recordings_count: number;
}

type WordMetricsMap = Record<string, WordLifetimeMetrics>;

// 손상 데이터는 `as` 단언으로 silent 통과시키지 않는다. entry 단위 type guard 로 검증해
// 유효한 항목만 통과시키고, 손상 항목은 제외하되 나머지는 보존하는 부분 복구를 수행한다.
// 검증 수준은 training-validation 과 동일(타입·정수/유한·음수 가드)하게 맞춘다.
function parseWordMetricsMap(raw: unknown): WordMetricsMap {
  if (!isRecord(raw)) {
    reportError(new Error('word-metrics 저장 형식이 객체가 아닙니다.'), {
      scope: 'analytics.wordMetrics.parse',
    });
    return {};
  }

  const recovered: WordMetricsMap = {};
  let droppedCount = 0;

  for (const [wordId, entry] of Object.entries(raw)) {
    if (isWordLifetimeMetrics(entry)) {
      recovered[wordId] = entry;
    } else {
      droppedCount += 1;
    }
  }

  // 손상 항목을 silent 하게 버리지 않는다 — seam 과 동일한 reportError 로 표면화한다.
  // 유효 항목은 이미 recovered 에 보존됐으므로 throw 하지 않고 부분 복구 결과를 반환한다.
  if (droppedCount > 0) {
    reportError(new Error(`word-metrics 손상 항목 ${droppedCount}건을 제외하고 복구했습니다.`), {
      scope: 'analytics.wordMetrics.parse',
    });
  }

  return recovered;
}

function isWordLifetimeMetrics(value: unknown): value is WordLifetimeMetrics {
  if (!isRecord(value)) {
    return false;
  }

  const metrics = value as Partial<WordLifetimeMetrics>;

  return (
    typeof metrics.word_id === 'string' &&
    typeof metrics.word_name === 'string' &&
    isNonNegativeInteger(metrics.lifetime_practice_count) &&
    isNonNegativeFiniteNumber(metrics.lifetime_practice_duration_ms) &&
    isNonNegativeInteger(metrics.lifetime_recording_count) &&
    typeof metrics.last_practiced_at_iso === 'string'
  );
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const metricsStore = persistKeyedStore<WordMetricsMap>({
  key: WORD_METRICS_STORAGE_KEY,
  scope: 'analytics.wordMetrics.load',
  parse: parseWordMetricsMap,
  fallback: () => ({}),
});

async function readMap(): Promise<WordMetricsMap> {
  return metricsStore.load();
}

async function writeMap(map: WordMetricsMap): Promise<void> {
  await metricsStore.save(map);
}

export async function getWordMetrics(wordId: string): Promise<WordLifetimeMetrics | null> {
  const map = await readMap();
  return map[wordId] ?? null;
}

export async function applySessionDeltas(deltas: readonly WordSessionDelta[]): Promise<readonly WordLifetimeMetrics[]> {
  if (deltas.length === 0) {
    return [];
  }

  const map = await readMap();
  const nowIso = new Date().toISOString();

  const updated: WordLifetimeMetrics[] = [];

  for (const delta of deltas) {
    const previous = map[delta.word_id];
    const next: WordLifetimeMetrics = {
      word_id: delta.word_id,
      word_name: delta.word_name,
      lifetime_practice_count: (previous?.lifetime_practice_count ?? 0) + 1,
      lifetime_practice_duration_ms:
        (previous?.lifetime_practice_duration_ms ?? 0) + delta.practice_duration_ms,
      lifetime_recording_count: (previous?.lifetime_recording_count ?? 0) + delta.recordings_count,
      last_practiced_at_iso: nowIso,
    };

    map[delta.word_id] = next;
    updated.push(next);
  }

  await writeMap(map);
  return updated;
}

export async function removeWordMetrics(wordId: string): Promise<WordLifetimeMetrics | null> {
  const map = await readMap();
  const previous = map[wordId] ?? null;

  if (previous) {
    delete map[wordId];
    await writeMap(map);
  }

  return previous;
}

