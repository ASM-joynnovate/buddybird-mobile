// flush 오케스트레이터(requestWordUpload·requestWordUploadFlush)의 시나리오 테스트 —
// I/O 협력자(스토어·클라이언트·게이트 입력)는 mock, 판정 모듈(gate·target·response)은 실제 구현을 쓴다.
// 상태 저장소는 객체로 시뮬레이션해 마킹이 실제로 반영돼야 다음 선별에서 빠진다.

import { reportError } from '@/features/analytics/error-reporter';
import { hydrateAudioUriFromStorage, recordingFileExists } from '@/features/audio/audio-file-storage';
import { getCurrentUid } from '@/features/auth/auth-identity';
import { readExtraString } from '@/features/shared/expo-extra';
import { loadUploadConsent } from '@/features/upload-consent/upload-consent-storage';

import { loadWordLibraryStore } from '../word-library-storage';
import type { WordEntry, WordLibraryStore } from '../word-library-types';
import { requestWordUpload, requestWordUploadFlush } from '../word-upload';
import { sendWord } from '../word-upload-client';
import { loadWordUploadState, markWordUploadResult, type WordUploadState } from '../word-upload-state';

jest.mock('@/features/analytics/error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/audio/audio-file-storage', () => ({
  hydrateAudioUriFromStorage: jest.fn(),
  recordingFileExists: jest.fn(),
}));
jest.mock('@/features/auth/auth-identity', () => ({ getCurrentUid: jest.fn() }));
jest.mock('@/features/shared/expo-extra', () => ({ readExtraString: jest.fn() }));
jest.mock('@/features/upload-consent/upload-consent-storage', () => ({ loadUploadConsent: jest.fn() }));
jest.mock('../word-library-storage', () => ({ loadWordLibraryStore: jest.fn() }));
jest.mock('../word-upload-client', () => ({ sendWord: jest.fn() }));
jest.mock('../word-upload-state', () => ({
  loadWordUploadState: jest.fn(),
  markWordUploadResult: jest.fn(),
}));

const sendMock = jest.mocked(sendWord);
const markMock = jest.mocked(markWordUploadResult);
const reportErrorMock = jest.mocked(reportError);

// fire-and-forget 진입점이라 완료를 직접 기다릴 수 없다 — mock 만 쓰는 promise 체인은
// macrotask 경계 하나면 전부 소진된다.
const drainFlush = () => new Promise((resolve) => setTimeout(resolve, 0));

let uploadState: WordUploadState;

function makeEntry(id: string, overrides: Partial<WordEntry> = {}): WordEntry {
  return {
    id,
    label: `단어-${id}`,
    tag: 'greeting',
    sourceType: 'recording',
    audioUri: `recording-${id}.m4a`,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function givenLibrary(...entries: WordEntry[]): void {
  const store: WordLibraryStore = {
    version: 1,
    entriesById: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
  jest.mocked(loadWordLibraryStore).mockResolvedValue(store);
}

beforeEach(() => {
  jest.clearAllMocks();
  uploadState = {};

  jest.mocked(loadUploadConsent).mockResolvedValue({
    status: 'granted',
    decidedAt: '2026-08-01T00:00:00.000Z',
    noticeVersion: 1,
  });
  jest.mocked(getCurrentUid).mockReturnValue('uid-1');
  jest.mocked(readExtraString).mockReturnValue('https://api.test');
  jest.mocked(hydrateAudioUriFromStorage).mockImplementation((uri) => `file:///abs/${uri}`);
  jest.mocked(recordingFileExists).mockReturnValue(true);
  jest.mocked(loadWordUploadState).mockImplementation(async () => uploadState);
  markMock.mockImplementation(async (id, status) => {
    uploadState[id] = { status };
  });
  sendMock.mockResolvedValue({ status: 200 });
  givenLibrary(makeEntry('w1'));
});

describe('requestWordUpload', () => {
  it('sends only the created word', async () => {
    givenLibrary(makeEntry('w1'), makeEntry('w2'));

    requestWordUpload('w2');
    await drainFlush();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientWordId: 'w2', label: '단어-w2', audioUri: 'file:///abs/recording-w2.m4a' }),
    );
  });

  it('marks the word uploaded on success', async () => {
    requestWordUpload('w1');
    await drainFlush();

    expect(markMock).toHaveBeenCalledWith('w1', 'uploaded');
  });
});

describe('requestWordUploadFlush', () => {
  it('sends every pending word one at a time', async () => {
    givenLibrary(makeEntry('w1'), makeEntry('w2'));

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock.mock.calls.map(([input]) => input.clientWordId)).toEqual(['w1', 'w2']);
  });

  it('skips words that already have a processing record', async () => {
    givenLibrary(makeEntry('w1'), makeEntry('w2'));
    uploadState = { w1: { status: 'failed' } };

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock.mock.calls.map(([input]) => input.clientWordId)).toEqual(['w2']);
  });

  it.each([
    ['gate closed by consent', () => jest.mocked(loadUploadConsent).mockResolvedValue({ status: 'denied', decidedAt: null, noticeVersion: 1 })],
    ['missing uid', () => jest.mocked(getCurrentUid).mockReturnValue(null)],
    ['missing api base url', () => jest.mocked(readExtraString).mockReturnValue(null)],
  ])('sends nothing when %s', async (_label, arrange) => {
    arrange();

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('marks a 4xx word failed and reports it', async () => {
    sendMock.mockResolvedValue({ status: 400 });

    requestWordUploadFlush();
    await drainFlush();

    expect(markMock).toHaveBeenCalledWith('w1', 'failed');
    expect(reportErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      scope: 'word-library.uploadFlush.rejected',
    });
  });

  it('leaves no record on 5xx so the next trigger retries', async () => {
    sendMock.mockResolvedValue({ status: 500 });

    requestWordUploadFlush();
    await drainFlush();

    expect(markMock).not.toHaveBeenCalled();
  });

  it('stops the run on 5xx instead of sending the rest', async () => {
    givenLibrary(makeEntry('w1'), makeEntry('w2'));
    sendMock.mockResolvedValue({ status: 503 });

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('keeps going past a 4xx word', async () => {
    givenLibrary(makeEntry('w1'), makeEntry('w2'));
    sendMock.mockResolvedValueOnce({ status: 400 }).mockResolvedValueOnce({ status: 200 });

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(markMock).toHaveBeenCalledWith('w1', 'failed');
    expect(markMock).toHaveBeenCalledWith('w2', 'uploaded');
  });

  it('skips a word whose reference audio file is gone', async () => {
    jest.mocked(recordingFileExists).mockReturnValue(false);

    requestWordUploadFlush();
    await drainFlush();

    expect(sendMock).not.toHaveBeenCalled();
    expect(markMock).not.toHaveBeenCalled();
  });
});
