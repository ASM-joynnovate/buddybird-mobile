import type { AppLocale } from '@/features/i18n/i18n-resources';
import type { CreateWordEntryInput, WordEntry, WordLibraryStore, WordTag } from './word-library-types';

export function createWordEntry(input: CreateWordEntryInput, nowIso: string): WordEntry {
  return {
    id: `wentry-${nowIso}-${Math.random().toString(36).slice(2, 10)}`,
    label: input.label.trim(),
    tag: input.tag,
    sourceType: input.sourceType,
    presetKey: input.presetKey,
    audioUri: input.audioUri,
    transformedAudioUri: input.transformedAudioUri,
    pitchProfileId: input.pitchProfileId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function upsertWordEntry(store: WordLibraryStore, entry: WordEntry, nowIso: string): WordLibraryStore {
  return {
    ...store,
    entriesById: {
      ...store.entriesById,
      [entry.id]: { ...entry, updatedAt: nowIso },
    },
    updatedAt: nowIso,
  };
}

export function deleteWordEntry(store: WordLibraryStore, id: string, nowIso: string): WordLibraryStore {
  const { [id]: _removed, ...rest } = store.entriesById;
  return {
    ...store,
    entriesById: rest,
    updatedAt: nowIso,
  };
}

// label 은 앵무새가 학습할 콘텐츠 데이터 — 전 로케일 프리셋의 유니온을 항상 시드하고,
// 표시 여부만 filterEntriesByLocale 로 로케일 분기한다 (BB-407). reconcile 을 로케일 무관으로
// 유지해야 로케일 전환 시 entry id 가 안정적이다 (training 이 wordId 를 세션 간 참조).
// key 는 audio-source-resolver 의 PRESET_AUDIO_MODULES 와 1:1 — 비-ko 키는 로케일 접두 필수
// (docs/I18N.md §3), ko 키는 하위 호환을 위해 무접두 유지.
const SEED_PRESETS: Array<{ key: string; label: string; tag: WordTag }> = [
  { key: 'hello', label: '안녕', tag: 'greeting' },
  { key: 'apple', label: '사과', tag: 'food' },
  { key: 'saranghae', label: '사랑해', tag: 'greeting' },
  { key: 'bye', label: '다녀와', tag: 'greeting' },
  { key: 'en-hi', label: 'Hi', tag: 'greeting' },
  { key: 'en-hello', label: 'Hello', tag: 'greeting' },
];

// 프리셋 엔트리 집합을 SEED_PRESETS 와 정확히 일치시킨다 (presetKey 기준) — idempotent.
// 프리셋은 삭제 불가 정책이라, (1) 빈 스토어 최초 시드, (2) 과거에 삭제된 프리셋 복원,
// (3) 구 시드 스킴의 잔여 프리셋(예: 키가 SEED_PRESETS 에 없는 것) 정리를 한 경로로 처리한다.
// 사용자 녹음(sourceType === 'recording')은 절대 건드리지 않는다.
export function reconcilePresetSeeds(
  store: WordLibraryStore,
  nowIso: string
): { store: WordLibraryStore; changed: boolean } {
  const seedKeys = new Set(SEED_PRESETS.map((p) => p.key));
  const entries = Object.values(store.entriesById);

  // 구 시드 스킴의 잔여 프리셋(현재 SEED_PRESETS 에 없는 presetKey) 제거 대상.
  const staleIds = entries
    .filter((e) => e.sourceType === 'preset' && !seedKeys.has(e.presetKey ?? ''))
    .map((e) => e.id);

  // 현재 존재하는 유효 프리셋 키 (잔여 제외).
  const existingKeys = new Set(
    entries
      .filter((e) => e.sourceType === 'preset' && seedKeys.has(e.presetKey ?? ''))
      .map((e) => e.presetKey)
  );
  const missing = SEED_PRESETS.filter((p) => !existingKeys.has(p.key));

  if (staleIds.length === 0 && missing.length === 0) return { store, changed: false };

  const entriesById = { ...store.entriesById };
  for (const id of staleIds) delete entriesById[id];
  for (const p of missing) {
    const entry = createWordEntry(
      { label: p.label, tag: p.tag, sourceType: 'preset', presetKey: p.key, audioUri: `preset://${p.label}` },
      nowIso
    );
    entriesById[entry.id] = entry;
  }
  return { store: { ...store, entriesById, updatedAt: nowIso }, changed: true };
}

// 프리셋 키의 로케일 — `<locale>-` 접두로 파생 (스키마 필드 없음). ko 키는 무접두라 fallback.
export function presetLocale(presetKey: string | undefined): AppLocale {
  return presetKey?.startsWith('en-') ? 'en' : 'ko';
}

// 표시용 로케일 필터 — 프리셋만 현재 로케일로 거르고 사용자 녹음은 항상 남긴다.
// 스토어 자체는 유니온을 유지하므로 표시 계층(word-library-context)에서만 사용한다.
export function filterEntriesByLocale(entries: WordEntry[], locale: AppLocale): WordEntry[] {
  return entries.filter((e) => e.sourceType !== 'preset' || presetLocale(e.presetKey) === locale);
}
