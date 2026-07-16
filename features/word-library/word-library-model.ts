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

// label 은 앵무새가 학습할 콘텐츠 데이터 — 프리셋 음원이 한국어뿐이라 언어 설정과 무관하게 동일 시드.
// key 는 audio-source-resolver 의 PRESET_AUDIO_MODULES(단일 네임스페이스)와 1:1.
const SEED_PRESETS: Array<{ key: string; label: string; tag: WordTag }> = [
  { key: 'hello', label: '안녕', tag: 'greeting' },
  { key: 'apple', label: '사과', tag: 'food' },
  { key: 'saranghae', label: '사랑해', tag: 'greeting' },
  { key: 'bye', label: '다녀와', tag: 'greeting' },
];

export function createPresetSeedEntries(nowIso: string): WordEntry[] {
  return SEED_PRESETS.map((p) =>
    createWordEntry(
      { label: p.label, tag: p.tag, sourceType: 'preset', presetKey: p.key, audioUri: `preset://${p.label}` },
      nowIso
    )
  );
}
