// 전송 payload 의 계약 준수 검증 — fetch 를 mock 해 실제로 붙는 필드 값을 확인한다.
// 서버 상한을 넘긴 값은 400 을 부르고, 400 은 영구 `failed` 로 굳어 그 단어가 다시 올라가지 않는다.
//
// 파일 파트({ uri, name, type })는 RN 의 FormData 구현에서만 객체로 유지되고 이 환경에서는
// 문자열로 평탄화되므로 여기서 검증하지 않는다 — 실기기 업로드로 확인한다.

import { sendWord } from '../word-upload-client';

let mockOsVersion: string | null = '18.4.1';
let mockModelName: string | null = 'iPhone 17 Pro';

jest.mock('expo-device', () => ({
  get osVersion() {
    return mockOsVersion;
  },
  get modelName() {
    return mockModelName;
  },
}));

const fetchMock = jest.fn();

function sentForm(): FormData {
  const [, init] = fetchMock.mock.calls[0] as [string, { body: FormData }];
  return init.body;
}

function requestedUrl(): string {
  return (fetchMock.mock.calls[0] as [string, unknown])[0];
}

const baseInput = {
  apiBaseUrl: 'https://api.test',
  uid: 'uid-1',
  clientWordId: 'wentry-1',
  label: '안녕',
  audioUri: 'file:///abs/recordings/recording-1.m4a',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockOsVersion = '18.4.1';
  mockModelName = 'iPhone 17 Pro';
  fetchMock.mockResolvedValue({ status: 200 });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('sendWord payload', () => {
  it('sends every field the contract requires', async () => {
    await sendWord(baseInput);
    const form = sentForm();

    expect(form.get('client_word_id')).toBe('wentry-1');
    expect(form.get('firebase_anon_uid')).toBe('uid-1');
    expect(form.get('label')).toBe('안녕');
    expect(form.get('device_platform')).toBe('iOS');
    expect(form.get('device_os_version')).toBe('18.4.1');
    expect(form.get('device_model')).toBe('iPhone 17 Pro');
    expect(form.has('audio_file')).toBe(true);
  });

  it('posts to the plural words path', async () => {
    await sendWord(baseInput);

    expect(requestedUrl()).toBe('https://api.test/api/v1/words');
  });

  // 끝 슬래시를 그대로 이으면 `//api/v1/words` 가 되고, 서버가 404 를 주면 4xx 폐기 경로로 흐른다.
  it('normalizes a trailing slash in the base url', async () => {
    await sendWord({ ...baseInput, apiBaseUrl: 'https://api.test///' });

    expect(requestedUrl()).toBe('https://api.test/api/v1/words');
  });

  it('sends empty device fields when the device info is unavailable', async () => {
    mockOsVersion = null;
    mockModelName = null;

    await sendWord(baseInput);
    const form = sentForm();

    expect(form.get('device_os_version')).toBe('');
    expect(form.get('device_model')).toBe('');
  });
});

describe('sendWord field limits', () => {
  // 단어 이름 입력란에 길이 제한이 없어 사용자가 상한을 넘길 수 있다.
  it('truncates a label longer than 50 characters', async () => {
    const label = '가'.repeat(60);

    await sendWord({ ...baseInput, label });
    const sent = sentForm().get('label') as string;

    expect(sent).toHaveLength(50);
    expect(sent).toBe(label.slice(0, 50));
  });

  it('keeps a label of exactly 50 characters intact', async () => {
    const label = '나'.repeat(50);

    await sendWord({ ...baseInput, label });

    expect(sentForm().get('label')).toBe(label);
  });

  it('truncates device fields to their contract limits', async () => {
    mockOsVersion = 'v'.repeat(40);
    mockModelName = 'm'.repeat(40);

    await sendWord(baseInput);
    const form = sentForm();

    expect(form.get('device_os_version')).toHaveLength(20);
    expect(form.get('device_model')).toHaveLength(30);
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
});
