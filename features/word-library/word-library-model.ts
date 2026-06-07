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
    pitchTransform: input.pitchTransform,
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

const SEED_PRESETS: Array<{ key: string; label: string; tag: WordTag }> = [
  { key: 'hello', label: '안녕', tag: '인사' },
  { key: 'apple', label: '사과', tag: '음식' },
  { key: 'saranghae', label: '사랑해', tag: '인사' },
  { key: 'bye', label: '다녀와', tag: '인사' },
];

export function createPresetSeedEntries(nowIso: string): WordEntry[] {
  return SEED_PRESETS.map((p) =>
    createWordEntry(
      { label: p.label, tag: p.tag, sourceType: 'preset', presetKey: p.key, audioUri: `preset://${p.label}` },
      nowIso
    )
  );
}
