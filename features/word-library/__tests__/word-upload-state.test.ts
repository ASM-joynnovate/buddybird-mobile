// 처리 기록 저장소 (SPEC-0003 §단어 업로드 — 상태 저장소).
// AsyncStorage seam(persist-keyed-store)은 mock 하고, 이 모듈이 소유한 것만 검증한다 —
// seam 에 주입하는 parse 계약과 기록 병합 규칙.

import { persistKeyedStore, type PersistKeyedStoreConfig } from '@/features/shared/persist-keyed-store';

import {
  WORD_UPLOAD_STATE_STORAGE_KEY,
  loadWordUploadState,
  markWordUploadResult,
  type WordUploadState,
} from '../word-upload-state';

const mockStoreLoad = jest.fn();
const mockStoreSave = jest.fn();

// seam 은 모듈 로드 시점에 호출된다 — 그 시점엔 아래 jest.fn 들이 아직 초기화 전이라 위임으로 잇는다.
jest.mock('@/features/shared/persist-keyed-store', () => ({
  persistKeyedStore: jest.fn(() => ({
    load: (...args: unknown[]) => mockStoreLoad(...args),
    save: (...args: unknown[]) => mockStoreSave(...args),
  })),
}));

const SARANGHAE_ID = 'wentry-2026-08-01T09:14:32.118Z-k3n8v2qa';
const DANYEOWA_ID = 'wentry-2026-08-03T18:41:09.552Z-p7t1m5xe';

// 모듈 로드 시점에 seam 에 넘긴 설정 — parse·fallback 이 여기 들어 있다.
const storeConfig = jest.mocked(persistKeyedStore).mock.calls[0][0] as PersistKeyedStoreConfig<WordUploadState>;

beforeEach(() => {
  mockStoreLoad.mockReset();
  mockStoreSave.mockReset();
  mockStoreLoad.mockResolvedValue({});
  mockStoreSave.mockResolvedValue(undefined);
});

describe('word upload state store', () => {
  it('persists under the contracted storage key', () => {
    expect(storeConfig.key).toBe('@buddybird/word-upload-state');
    expect(WORD_UPLOAD_STATE_STORAGE_KEY).toBe('@buddybird/word-upload-state');
  });

  it('reports load failures under the word-library scope', () => {
    expect(storeConfig.scope).toBe('word-library.uploadState.load');
  });

  // 깨진 기록은 빈 상태로 되돌린다 — 전량 재전송이 되지만 서버가
  // (firebase_anon_uid, client_word_id) 멱등이라 중복 행이 생기지 않는다.
  it('falls back to an empty state when nothing is stored', () => {
    expect(storeConfig.fallback()).toEqual({});
  });
});

describe('word upload state parsing', () => {
  const parse = (raw: unknown): WordUploadState => storeConfig.parse(raw);

  it('accepts a record of contracted statuses', () => {
    const stored = {
      [SARANGHAE_ID]: { status: 'uploaded' },
      [DANYEOWA_ID]: { status: 'failed' },
    };

    expect(parse(stored)).toEqual(stored);
  });

  it('accepts an empty record', () => {
    expect(parse({})).toEqual({});
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a json string', '{}'],
    ['a number', 42],
    ['an array', []],
  ])('rejects %s as a payload', (_case, raw) => {
    expect(() => parse(raw)).toThrow();
  });

  it.each(['pending', 'UPLOADED', 'sent', ''])('rejects the uncontracted status %p', (status) => {
    expect(() => parse({ [SARANGHAE_ID]: { status } })).toThrow();
  });

  it('rejects an entry that carries no status', () => {
    expect(() => parse({ [SARANGHAE_ID]: {} })).toThrow();
  });

  it('names the offending word so the report can be traced', () => {
    expect(() => parse({ [SARANGHAE_ID]: { status: 'pending' } })).toThrow(SARANGHAE_ID);
  });
});

describe('loadWordUploadState', () => {
  it('returns the record the store loaded', async () => {
    mockStoreLoad.mockResolvedValue({ [SARANGHAE_ID]: { status: 'uploaded' } });

    expect(await loadWordUploadState()).toEqual({ [SARANGHAE_ID]: { status: 'uploaded' } });
  });
});

describe('markWordUploadResult', () => {
  it('keeps the records of other words when writing a new one', async () => {
    mockStoreLoad.mockResolvedValue({ [SARANGHAE_ID]: { status: 'uploaded' } });

    await markWordUploadResult(DANYEOWA_ID, 'failed');

    expect(mockStoreSave).toHaveBeenCalledWith({
      [SARANGHAE_ID]: { status: 'uploaded' },
      [DANYEOWA_ID]: { status: 'failed' },
    });
  });

  it('overwrites the existing record of the same word', async () => {
    mockStoreLoad.mockResolvedValue({ [SARANGHAE_ID]: { status: 'failed' } });

    await markWordUploadResult(SARANGHAE_ID, 'uploaded');

    expect(mockStoreSave).toHaveBeenCalledWith({ [SARANGHAE_ID]: { status: 'uploaded' } });
  });
});
