import type { WordEntry } from '../word-library-types';
import type { WordUploadState } from '../word-upload-state';
import { mergeUploadTargets, selectPendingWords } from '../word-upload-target';

function makeEntry(overrides: Partial<WordEntry> & Pick<WordEntry, 'id'>): WordEntry {
  return {
    label: '안녕',
    tag: 'greeting',
    sourceType: 'recording',
    audioUri: 'recording-1.m4a',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('selectPendingWords', () => {
  it('keeps recording words without a processing record', () => {
    const entries = [makeEntry({ id: 'w1' })];

    expect(selectPendingWords(entries, {}).map((entry) => entry.id)).toEqual(['w1']);
  });

  it('drops preset words because the server seeds them', () => {
    const entries = [makeEntry({ id: 'w1', sourceType: 'preset', presetKey: 'hello' })];

    expect(selectPendingWords(entries, {})).toEqual([]);
  });

  it.each(['uploaded', 'failed'] as const)('drops words already recorded as %s', (status) => {
    const entries = [makeEntry({ id: 'w1' })];
    const state: WordUploadState = { w1: { status } };

    expect(selectPendingWords(entries, state)).toEqual([]);
  });

  it('orders by creation time so the oldest word goes first', () => {
    const entries = [
      makeEntry({ id: 'newer', createdAt: '2026-08-03T00:00:00.000Z' }),
      makeEntry({ id: 'older', createdAt: '2026-08-01T00:00:00.000Z' }),
    ];

    expect(selectPendingWords(entries, {}).map((entry) => entry.id)).toEqual(['older', 'newer']);
  });

  it('keeps other words pending when one of them is already recorded', () => {
    const entries = [makeEntry({ id: 'done' }), makeEntry({ id: 'pending' })];
    const state: WordUploadState = { done: { status: 'uploaded' } };

    expect(selectPendingWords(entries, state).map((entry) => entry.id)).toEqual(['pending']);
  });
});

describe('mergeUploadTargets', () => {
  it('takes the incoming target when nothing is queued', () => {
    expect(mergeUploadTargets(null, { kind: 'single', wordId: 'w1' })).toEqual({
      kind: 'single',
      wordId: 'w1',
    });
  });

  it('keeps a single target when the same word arrives again', () => {
    const queued = { kind: 'single', wordId: 'w1' } as const;

    expect(mergeUploadTargets(queued, { kind: 'single', wordId: 'w1' })).toEqual(queued);
  });

  // 둘 중 하나를 버리면 그 단어가 다음 콜드 스타트까지 서버에 올라가지 못한다.
  it('widens to all when two different words are queued', () => {
    const queued = { kind: 'single', wordId: 'w1' } as const;

    expect(mergeUploadTargets(queued, { kind: 'single', wordId: 'w2' })).toEqual({ kind: 'all' });
  });

  it.each([
    ['queued all, incoming single', { kind: 'all' } as const, { kind: 'single', wordId: 'w1' } as const],
    ['queued single, incoming all', { kind: 'single', wordId: 'w1' } as const, { kind: 'all' } as const],
    ['both all', { kind: 'all' } as const, { kind: 'all' } as const],
  ])('stays on all when %s', (_label, queued, incoming) => {
    expect(mergeUploadTargets(queued, incoming)).toEqual({ kind: 'all' });
  });
});
