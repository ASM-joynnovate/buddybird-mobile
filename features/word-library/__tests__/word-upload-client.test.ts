// 전송 책임만 검증한다 — 무엇을 보낼지의 규칙은 word-upload-request 가 소유하고 거기서 검증한다.
// 파일 파트({ uri, name, type })는 RN 의 FormData 구현에서만 객체로 유지되고 이 환경에서는
// 문자열로 평탄화되므로 존재 여부만 확인한다.

import { sendWord } from '../word-upload-client';

jest.mock('expo-device', () => ({ osVersion: '18.4.1', modelName: 'iPhone 17 Pro' }));

const fetchMock = jest.fn();

const baseInput = {
  apiBaseUrl: 'https://api.test',
  uid: 'uid-1',
  clientWordId: 'wentry-1',
  label: '안녕',
  audioUri: 'file:///abs/recordings/recording-1.m4a',
};

function sentRequest(): { url: string; form: FormData; signal: AbortSignal } {
  const [url, init] = fetchMock.mock.calls[0] as [string, { body: FormData; signal: AbortSignal }];
  return { url, form: init.body, signal: init.signal };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockResolvedValue({ status: 200 });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('sendWord transport', () => {
  it('posts the built request as multipart form data', async () => {
    await sendWord(baseInput);
    const { url, form } = sentRequest();

    expect(url).toBe('https://api.test/api/v1/words');
    expect(form.get('client_word_id')).toBe('wentry-1');
    expect(form.get('firebase_anon_uid')).toBe('uid-1');
    expect(form.get('label')).toBe('안녕');
    expect(form.get('device_platform')).toBe('iOS');
    expect(form.has('audio_file')).toBe(true);
  });

  it('sends one word per request', async () => {
    await sendWord(baseInput);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // 무응답 서버에 flush 가 무기한 잡히지 않도록 abort 신호를 함께 보낸다.
  it('attaches an abort signal', async () => {
    await sendWord(baseInput);

    expect(sentRequest().signal).toBeInstanceOf(AbortSignal);
  });
});

describe('sendWord result', () => {
  it.each([200, 400, 500])('returns the http status %s as-is', async (status) => {
    fetchMock.mockResolvedValue({ status });

    expect(await sendWord(baseInput)).toEqual({ status });
  });

  // 네트워크 오류는 여기서 throw 하지 않는다 — 해석은 response 모듈이 한다.
  it('returns a null status when the request produced no response', async () => {
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    expect(await sendWord(baseInput)).toEqual({ status: null });
  });

  it('returns a null status when the request is aborted by the timeout', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    expect(await sendWord(baseInput)).toEqual({ status: null });
  });
});
