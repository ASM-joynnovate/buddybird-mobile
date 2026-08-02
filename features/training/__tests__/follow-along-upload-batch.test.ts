import type { FollowAlongCapture } from '../follow-along-capture-types';
import {
  buildCaptureBatchMetadata,
  MAX_CAPTURE_BATCH_BYTES,
  MAX_CAPTURE_BATCH_SIZE,
  planCaptureBatch,
} from '../follow-along-upload-batch';

function makeCapture(overrides: Partial<FollowAlongCapture> & { id: string }): FollowAlongCapture {
  return {
    sessionId: 'sess_1',
    wordId: 'word-1',
    cycle: 1,
    phase: 'learning',
    capturedAt: '2026-08-02T00:00:00.000Z',
    uri: `file:///captures/${overrides.id}.wav`,
    fileName: `${overrides.id}.wav`,
    segments: [],
    sizeBytes: 100,
    clientWordId: 'preset-hello',
    parrotSpecies: 'budgie',
    parrotBirthdate: '2025-08-01',
    ...overrides,
  };
}

function makeCaptures(count: number): FollowAlongCapture[] {
  return Array.from({ length: count }, (_, i) =>
    makeCapture({ id: `cap-${i}`, capturedAt: `2026-08-02T00:00:${String(i).padStart(2, '0')}.000Z` }),
  );
}

describe('planCaptureBatch', () => {
  const fileAlwaysExists = () => true;

  it('returns an empty plan for no captures', () => {
    expect(planCaptureBatch([], fileAlwaysExists)).toEqual({ batch: [], missingFileIds: [] });
  });

  it('keeps a single capture', () => {
    const captures = makeCaptures(1);
    expect(planCaptureBatch(captures, fileAlwaysExists).batch).toHaveLength(1);
  });

  it('keeps exactly 10 captures in one batch', () => {
    const captures = makeCaptures(10);
    expect(planCaptureBatch(captures, fileAlwaysExists).batch).toHaveLength(MAX_CAPTURE_BATCH_SIZE);
  });

  it('caps a batch at 10 with the oldest first', () => {
    const captures = makeCaptures(11).reverse(); // 입력 순서와 무관하게 정렬돼야 한다
    const { batch } = planCaptureBatch(captures, fileAlwaysExists);
    expect(batch).toHaveLength(MAX_CAPTURE_BATCH_SIZE);
    expect(batch[0].id).toBe('cap-0');
    expect(batch[9].id).toBe('cap-9');
  });

  it('separates records whose local file is missing', () => {
    const captures = makeCaptures(3);
    const { batch, missingFileIds } = planCaptureBatch(captures, (c) => c.id !== 'cap-1');
    expect(batch.map((c) => c.id)).toEqual(['cap-0', 'cap-2']);
    expect(missingFileIds).toEqual(['cap-1']);
  });

  it('cuts the batch when the raw byte budget would be exceeded', () => {
    const half = MAX_CAPTURE_BATCH_BYTES / 2;
    const captures = makeCaptures(3).map((c) => ({ ...c, sizeBytes: half }));
    // 2건 = 정확히 예산(포함), 3건째는 초과라 2건에서 끊긴다.
    const { batch } = planCaptureBatch(captures, fileAlwaysExists);
    expect(batch.map((c) => c.id)).toEqual(['cap-0', 'cap-1']);
  });

  it('fills all 10 when the budget is not exceeded', () => {
    const captures = makeCaptures(11).map((c) => ({ ...c, sizeBytes: 100 }));
    expect(planCaptureBatch(captures, fileAlwaysExists).batch).toHaveLength(MAX_CAPTURE_BATCH_SIZE);
  });

  it('keeps a single over-budget capture so the queue cannot stall', () => {
    const captures = makeCaptures(2).map((c) => ({ ...c, sizeBytes: MAX_CAPTURE_BATCH_BYTES * 2 }));
    // 첫 건이 혼자 예산을 넘어도 1건은 담는다 — 서버 단건 검증(rejected)에 맡긴다.
    const { batch } = planCaptureBatch(captures, fileAlwaysExists);
    expect(batch.map((c) => c.id)).toEqual(['cap-0']);
  });
});

describe('buildCaptureBatchMetadata', () => {
  it('maps capture fields to the server contract', () => {
    const [item] = buildCaptureBatchMetadata([makeCapture({ id: 'cap-a' })], '1.2.3');
    expect(item).toEqual({
      client_capture_id: 'cap-a',
      client_word_id: 'preset-hello',
      client_session_id: 'sess_1',
      cycle: 1,
      phase: 'LE',
      captured_at: '2026-08-02T00:00:00.000Z',
      file_name: 'cap-a.wav',
      app_version: '1.2.3',
      parrot_species: 'budgie',
      parrot_birthdate: '2025-08-01',
    });
  });

  it('maps rest phase to RE', () => {
    const [item] = buildCaptureBatchMetadata([makeCapture({ id: 'cap-a', phase: 'rest' })], null);
    expect(item.phase).toBe('RE');
  });

  it('normalizes capturedAt to UTC', () => {
    const [item] = buildCaptureBatchMetadata(
      [makeCapture({ id: 'cap-a', capturedAt: '2026-08-02T09:00:00.000+09:00' })],
      null,
    );
    expect(item.captured_at).toBe('2026-08-02T00:00:00.000Z');
  });

  it('passes an unparseable capturedAt through unchanged', () => {
    const [item] = buildCaptureBatchMetadata([makeCapture({ id: 'cap-a', capturedAt: '' })], null);
    expect(item.captured_at).toBe('');
  });

  it('omits optional fields when the profile snapshot is null and app version unreadable', () => {
    const [item] = buildCaptureBatchMetadata(
      [makeCapture({ id: 'cap-a', parrotSpecies: null, parrotBirthdate: null })],
      null,
    );
    expect(item).not.toHaveProperty('app_version');
    expect(item).not.toHaveProperty('parrot_species');
    expect(item).not.toHaveProperty('parrot_birthdate');
  });

  it('falls back to the raw wordId when clientWordId is absent', () => {
    const [item] = buildCaptureBatchMetadata([makeCapture({ id: 'cap-a', clientWordId: undefined })], null);
    expect(item.client_word_id).toBe('word-1');
  });

  it('prefixes the id on file name collisions within a batch', () => {
    const items = buildCaptureBatchMetadata(
      [
        makeCapture({ id: 'cap-a', fileName: 'same.wav' }),
        makeCapture({ id: 'cap-b', fileName: 'same.wav' }),
      ],
      null,
    );
    expect(items[0].file_name).toBe('same.wav');
    expect(items[1].file_name).toBe('cap-b-same.wav');
  });

  it('truncates over-limit app_version and parrot_species', () => {
    const [item] = buildCaptureBatchMetadata(
      [makeCapture({ id: 'cap-a', parrotSpecies: 'x'.repeat(60) })],
      '1.2.3-alpha.long+build',
    );
    expect(item.app_version).toHaveLength(12);
    expect(item.parrot_species).toHaveLength(50);
  });
});
