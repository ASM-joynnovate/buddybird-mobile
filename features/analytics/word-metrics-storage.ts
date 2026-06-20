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

function parseWordMetricsMap(raw: unknown): WordMetricsMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return raw as WordMetricsMap;
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

