// 전송 책임만 검증한다 — 무엇을 보낼지의 규칙은 word-upload-request 가 소유하고 거기서 검증한다.
// 파일 파트({ uri, name, type })는 RN 의 FormData 구현에서만 객체로 유지되고 이 환경에서는
// 문자열로 평탄화되므로 존재 여부만 확인한다.

import { sendWord, type SendWordInput } from '../word-upload-client';

jest.mock('expo-device', () => ({ osVersion: '18.4.1', modelName: 'iPhone 17 Pro' }));

// word-upload-client.ts 의 WORD_UPLOAD_TIMEOUT_MS 와 같은 값.
const UPLOAD_TIMEOUT_MS = 30_000;

const RECORDINGS_DIRECTORY =
  'file:///var/mobile/Containers/Data/Application/6F3C1E1A-2B77-4E5D-9C42-8D0B5A9E7C31/Documents/recordings';

const baseInput: SendWordInput = {
  apiBaseUrl: 'https://api.buddybird.app',
  uid: 'Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3',
  clientWordId: 'wentry-2026-08-01T09:14:32.118Z-k3n8v2qa',
  label: '사랑해',
  audioUri: `${RECORDINGS_DIRECTORY}/recording-2026-08-01T09-14-32-118Z.m4a`,
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
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ status: 200 });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe('sendWord transport', () => {
  it('posts the built request as multipart form data', async () => {
    await sendWord(baseInput);

    const { url, form } = sentRequest();

    expect(url).toBe('https://api.buddybird.app/api/v1/words');
    expect(form.get('client_word_id')).toBe('wentry-2026-08-01T09:14:32.118Z-k3n8v2qa');
    expect(form.get('firebase_anon_uid')).toBe('Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3');
    expect(form.get('label')).toBe('사랑해');
    expect(form.get('device_platform')).toBe('iOS');
    expect(form.get('device_os_version')).toBe('18.4.1');
    expect(form.get('device_model')).toBe('iPhone 17 Pro');
    expect(form.has('audio_file')).toBe(true);
  });

  it('sends one word per request', async () => {
    await sendWord(baseInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('attaches an abort signal to the request', async () => {
    await sendWord(baseInput);

    expect(sentRequest().signal).toBeInstanceOf(AbortSignal);
  });
});

describe('sendWord result', () => {
  it.each([200, 400, 500])('returns the http status %i as-is', async (status) => {
    fetchMock.mockResolvedValue({ status });

    expect(await sendWord(baseInput)).toEqual({ status });
  });

  // 네트워크 오류는 여기서 throw 하지 않는다 — 해석은 response 모듈이 한다.
  it('returns a null status when the request produced no response', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    expect(await sendWord(baseInput)).toEqual({ status: null });
  });

  it('returns a null status when the request is aborted', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    expect(await sendWord(baseInput)).toEqual({ status: null });
  });
});

describe('sendWord timeout', () => {
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

    const pending = sendWord(baseInput);
    jest.advanceTimersByTime(UPLOAD_TIMEOUT_MS);

    await expect(pending).resolves.toEqual({ status: null });
  });

  it('leaves the signal untouched when the server answers in time', async () => {
    jest.useFakeTimers();

    await sendWord(baseInput);
    jest.advanceTimersByTime(UPLOAD_TIMEOUT_MS);

    expect(sentRequest().signal.aborted).toBe(false);
  });
});
