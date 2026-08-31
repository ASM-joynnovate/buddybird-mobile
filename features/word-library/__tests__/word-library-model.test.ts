// 프리셋 시드·로케일 분기(BB-407) 모델 함수 — 순수 함수라 목 없이 검증한다.
// 유니온 시드가 기존 엔트리를 보존하는지, 표시 필터가 로케일별로 프리셋만 거르는지 본다.

import { createWordEntry, filterEntriesByLocale, presetLocale, reconcilePresetSeeds } from '../word-library-model';
import type { WordLibraryStore } from '../word-library-types';

const ISO = '2026-08-25T10:00:00.000Z';
const BETWEEN = '2026-08-25T10:30:00.000Z';
const LATER = '2026-08-25T11:00:00.000Z';

const KO_PRESET_KEYS = ['hello', 'apple', 'saranghae', 'bye'];
const EN_PRESET_KEYS = ['en-hi', 'en-hello'];

function storeOf(...entries: ReturnType<typeof createWordEntry>[]): WordLibraryStore {
  return {
    version: 1,
    entriesById: Object.fromEntries(entries.map((e) => [e.id, e])),
    updatedAt: ISO,
  };
}

function presetEntryOf(key: string, label: string): ReturnType<typeof createWordEntry> {
  return createWordEntry(
    { label, tag: 'greeting', sourceType: 'preset', presetKey: key, audioUri: `preset://${label}` },
    ISO,
  );
}

describe('reconcilePresetSeeds', () => {
  it('빈 스토어에 전 로케일 유니온(ko 4 + en 2)을 시드한다', () => {
    const { store, changed } = reconcilePresetSeeds(storeOf(), ISO);
    const presets = Object.values(store.entriesById);
    expect(changed).toBe(true);
    expect(presets.map((e) => e.presetKey).sort()).toEqual([...KO_PRESET_KEYS, ...EN_PRESET_KEYS].sort());

    const hi = presets.find((e) => e.presetKey === 'en-hi');
    const hello = presets.find((e) => e.presetKey === 'en-hello');
    expect(hi).toMatchObject({ label: 'Hi', tag: 'greeting', audioUri: 'preset://Hi' });
    expect(hello).toMatchObject({ label: 'Hello', tag: 'greeting', audioUri: 'preset://Hello' });
  });

  it('ko 프리셋만 있는 기존 스토어에는 en 만 추가하고 기존 id 와 녹음을 보존한다', () => {
    const koPresets = [
      presetEntryOf('hello', '안녕'),
      presetEntryOf('apple', '사과'),
      presetEntryOf('saranghae', '사랑해'),
      presetEntryOf('bye', '다녀와'),
    ];
    const recording = createWordEntry(
      { label: '까꿍', tag: 'greeting', sourceType: 'recording', audioUri: 'recording://a.m4a' },
      ISO,
    );
    const { store, changed } = reconcilePresetSeeds(storeOf(...koPresets, recording), LATER);
    expect(changed).toBe(true);
    for (const p of koPresets) expect(store.entriesById[p.id]).toBe(p);
    expect(store.entriesById[recording.id]).toBe(recording);
    const addedKeys = Object.values(store.entriesById)
      .filter((e) => e.sourceType === 'preset' && !koPresets.some((p) => p.id === e.id))
      .map((e) => e.presetKey)
      .sort();
    expect(addedKeys).toEqual([...EN_PRESET_KEYS].sort());
  });

  it('시드가 완료된 스토어에는 변경 없이 원본을 반환한다 (idempotent)', () => {
    const seeded = reconcilePresetSeeds(storeOf(), ISO).store;
    const second = reconcilePresetSeeds(seeded, LATER);
    expect(second.changed).toBe(false);
    expect(second.store).toBe(seeded);
  });

  it('SEED_PRESETS 에 없는 잔여 프리셋은 제거하되 ko/en 프리셋은 유지한다', () => {
    const seeded = reconcilePresetSeeds(storeOf(), ISO).store;
    const stale = presetEntryOf('legacy-key', '옛단어');
    const withStale = { ...seeded, entriesById: { ...seeded.entriesById, [stale.id]: stale } };
    const { store, changed } = reconcilePresetSeeds(withStale, LATER);
    expect(changed).toBe(true);
    expect(store.entriesById[stale.id]).toBeUndefined();
    expect(Object.values(store.entriesById).map((e) => e.presetKey).sort()).toEqual(
      [...KO_PRESET_KEYS, ...EN_PRESET_KEYS].sort(),
    );
  });
});

describe('presetLocale', () => {
  it('en- 접두 키는 en, 무접두 ko 키와 undefined 는 ko 로 판별한다', () => {
    expect(presetLocale('en-hi')).toBe('en');
    expect(presetLocale('hello')).toBe('ko');
    expect(presetLocale(undefined)).toBe('ko');
  });
});

describe('filterEntriesByLocale', () => {
  it('프리셋은 현재 로케일만 남기고 사용자 녹음은 로케일 무관 유지한다', () => {
    const seeded = reconcilePresetSeeds(storeOf(), ISO).store;
    const recording = createWordEntry(
      { label: '까꿍', tag: 'greeting', sourceType: 'recording', audioUri: 'recording://a.m4a' },
      ISO,
    );
    const entries = [...Object.values(seeded.entriesById), recording];

    const ko = filterEntriesByLocale(entries, 'ko');
    expect(ko.filter((e) => e.sourceType === 'preset').map((e) => e.presetKey).sort()).toEqual(
      [...KO_PRESET_KEYS].sort(),
    );
    expect(ko).toContain(recording);

    const en = filterEntriesByLocale(entries, 'en');
    expect(en.filter((e) => e.sourceType === 'preset').map((e) => e.presetKey).sort()).toEqual(
      [...EN_PRESET_KEYS].sort(),
    );
    expect(en).toContain(recording);
  });

  it('마이그레이션으로 늦게 추가된 en 프리셋도 사용자 녹음보다 먼저 표시한다', () => {
    const koPresets = [
      presetEntryOf('hello', '안녕'),
      presetEntryOf('apple', '사과'),
      presetEntryOf('saranghae', '사랑해'),
      presetEntryOf('bye', '다녀와'),
    ];
    const recording = createWordEntry(
      { label: '까꿍', tag: 'greeting', sourceType: 'recording', audioUri: 'recording://a.m4a' },
      BETWEEN,
    );
    const migrated = reconcilePresetSeeds(storeOf(...koPresets, recording), LATER).store;
    const chronologicalEntries = Object.values(migrated.entriesById).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );

    const en = filterEntriesByLocale(chronologicalEntries, 'en');

    expect(en.map((e) => e.presetKey ?? e.label)).toEqual(['en-hi', 'en-hello', '까꿍']);
  });
});
