// 전송 책임만 검증한다 — 배치에 무엇을 담을지의 규칙은 follow-along-upload-batch 가 소유하고
// 거기서 검증한다. 파일 파트({ uri, name, type })는 RN 의 FormData 구현에서만 객체로 유지되고
// 이 환경에서는 문자열로 평탄화되므로 존재 여부만 확인한다.
// 계약 필드가 하나만 틀려도 서버 400 → 단건 분할 → 폐기로 사용자의 클립이 사라진다.

import type { FollowAlongCapture } from '../follow-along-capture-types';
import type { CaptureUploadMetadataItem } from '../follow-along-upload-batch';
import { CAPTURE_UPLOAD_TIMEOUT_MS, sendCaptureBatch } from '../follow-along-upload-client';

jest.mock('expo-device', () => ({ osVersion: '18.4.1', modelName: 'iPhone 17 Pro' }));
jest.mock('fflate', () => ({ zipSync: () => new Uint8Array([1, 2, 3]) }));

const mockZipUri = 'file:///cache/capture-upload/captures.zip';
const mockUnreadableUris = new Set<string>();

// `new File(uri)` 는 캡처 원본 읽기, `new File(directory, name)` 은 zip 쓰기 — 인자 수로 가른다.
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  Directory: jest.fn().mockImplementation(() => ({
    exists: false,
    create: jest.fn(),
    delete: jest.fn(),
  })),
  File: jest.fn().mockImplementation((...args: unknown[]) => {
    if (args.length === 1) {
      const uri = args[0] as string;
      return {
        bytesSync: () => {
          if (mockUnreadableUris.has(uri)) throw new Error('file unreadable');
          return new Uint8Array([9]);
        },
      };
    }
    return { uri: mockZipUri, exists: true, write: jest.fn(), delete: jest.fn() };
  }),
}));

function makeCapture(id: string): FollowAlongCapture {
  return {
    id,
    sessionId: 'sess_1',
    wordId: 'word-1',
    cycle: 1,
    phase: 'learning',
    capturedAt: '2026-08-02T00:00:00.000Z',
    uri: `file:///captures/${id}.wav`,
    fileName: `${id}.wav`,
    segments: [],
    sizeBytes: 100,
    clientWordId: 'preset-hello',
    parrotSpecies: 'budgie',
    parrotBirthdate: '2025-08-01',
  } as FollowAlongCapture;
}

function makeMetadata(id: string): CaptureUploadMetadataItem {
  return {
    client_capture_id: id,
    client_word_id: 'preset-hello',
    client_session_id: 'sess_1',
    cycle: 1,
    phase: 'LE',
    captured_at: '2026-08-02T00:00:00.000Z',
    file_name: `${id}.wav`,
  };
}

const baseInput = {
  apiBaseUrl: 'https://api.buddybird.app',
  uid: 'Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3',
  batch: [makeCapture('cap-a')],
  metadata: [makeMetadata('cap-a')],
};

const fetchMock = jest.fn();
let originalFetch: typeof global.fetch;

function sentRequest(): { url: string; form: FormData; signal: AbortSignal } {
  expect(fetchMock).toHaveBeenCalled();
  const [url, init] = fetchMock.mock.calls[0] as [string, { body: FormData; signal: AbortSignal }];
  return { url, form: init.body, signal: init.signal };
}

beforeEach(() => {
  originalFetch = global.fetch;
  mockUnreadableUris.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ status: 200, json: async () => ({ results: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe('sendCaptureBatch transport', () => {
  it('posts the batch to the plural captures path', async () => {
    await sendCaptureBatch(baseInput);

    expect(sentRequest().url).toBe('https://api.buddybird.app/api/v1/captures');
  });

  // 끝 슬래시를 그대로 이으면 `//api/v1/captures` 가 되고, 서버 404 는 4xx 폐기 경로로 흘러
  // 설정 실수 하나가 캡처 전량 폐기로 증폭된다.
  it.each(['https://api.buddybird.app/', 'https://api.buddybird.app///'])(
    'normalizes the trailing slash in %s',
    async (apiBaseUrl) => {
      await sendCaptureBatch({ ...baseInput, apiBaseUrl });

      expect(sentRequest().url).toBe('https://api.buddybird.app/api/v1/captures');
    },
  );

  // 단어 업로드와 같은 계약 필드다 — 이름이 하나만 어긋나도 400 이 오고 배치가 폐기된다.
  it('sends every contract field the batch endpoint requires', async () => {
    await sendCaptureBatch(baseInput);

    const { form } = sentRequest();

    expect(form.get('firebase_anon_uid')).toBe('Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3');
    expect(form.get('device_platform')).toBe('iOS');
    expect(form.get('device_os_version')).toBe('18.4.1');
    expect(form.get('device_model')).toBe('iPhone 17 Pro');
    expect(form.get('metadata')).toBe(JSON.stringify([makeMetadata('cap-a')]));
    expect(form.has('file')).toBe(true);
  });

  it('sends only the metadata of captures that were actually read', async () => {
    mockUnreadableUris.add('file:///captures/cap-b.wav');

    const outcome = await sendCaptureBatch({
      ...baseInput,
      batch: [makeCapture('cap-a'), makeCapture('cap-b')],
      metadata: [makeMetadata('cap-a'), makeMetadata('cap-b')],
    });

    expect(outcome.sentIds).toEqual(['cap-a']);
    expect(outcome.unreadableIds).toEqual(['cap-b']);
    expect(sentRequest().form.get('metadata')).toBe(JSON.stringify([makeMetadata('cap-a')]));
  });

  it('skips the request when no capture file could be read', async () => {
    mockUnreadableUris.add('file:///captures/cap-a.wav');

    const outcome = await sendCaptureBatch(baseInput);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(outcome).toEqual({ http: null, sentIds: [], unreadableIds: ['cap-a'] });
  });

  it('attaches an abort signal to the request', async () => {
    await sendCaptureBatch(baseInput);

    expect(sentRequest().signal).toBeInstanceOf(AbortSignal);
  });
});

describe('sendCaptureBatch result', () => {
  it.each([200, 207, 400, 500])('returns the http status %i as-is', async (status) => {
    fetchMock.mockResolvedValue({ status, json: async () => ({}) });

    expect((await sendCaptureBatch(baseInput)).http).toEqual({ status, body: {} });
  });

  // 네트워크 오류는 여기서 throw 하지 않는다 — 해석은 response 모듈이 한다.
  it('returns a null status when the request produced no response', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    expect((await sendCaptureBatch(baseInput)).http).toEqual({ status: null, body: null });
  });

  // 프록시가 준 HTML 처럼 JSON 이 아닌 본문도 온다 — 상태 코드만으로 해석한다.
  it('falls back to a null body when the response is not json', async () => {
    fetchMock.mockResolvedValue({
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    });

    expect((await sendCaptureBatch(baseInput)).http).toEqual({ status: 502, body: null });
  });
});

describe('sendCaptureBatch timeout', () => {
  // 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힌다.
  it('aborts a request that the server never answers', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        });
      });
    });

    const pending = sendCaptureBatch(baseInput);
    jest.advanceTimersByTime(CAPTURE_UPLOAD_TIMEOUT_MS);

    expect((await pending).http).toEqual({ status: null, body: null });
  });

  // 헤더만 주고 본문에서 멎는 서버도 같은 타임아웃 창 안에서 끊어야 flush 가 풀린다.
  // 본문 없이 끝난 2xx 는 body: null 로 나가고, 해석 단계에서 전 항목 unresolved 가 되어
  // 클립이 삭제되지 않고 큐에 남는다 — 확인 못 받은 클립을 지우지 않는 쪽이 안전하다.
  it('settles instead of hanging when the response body never arrives', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({
      status: 200,
      json: () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })), 90_000);
        }),
    });

    const pending = sendCaptureBatch(baseInput);
    await jest.advanceTimersByTimeAsync(90_000);

    expect((await pending).http).toEqual({ status: 200, body: null });
  });

  it('leaves the signal untouched when the server answers in time', async () => {
    jest.useFakeTimers();

    await sendCaptureBatch(baseInput);
    jest.advanceTimersByTime(CAPTURE_UPLOAD_TIMEOUT_MS);

    expect(sentRequest().signal.aborted).toBe(false);
  });
});
