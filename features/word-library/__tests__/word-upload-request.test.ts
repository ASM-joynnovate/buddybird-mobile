import { buildWordUploadRequest } from '../word-upload-request';

const baseInput = {
  apiBaseUrl: 'https://api.test',
  uid: 'uid-1',
  clientWordId: 'wentry-1',
  label: '안녕',
  audioUri: 'file:///abs/recordings/recording-1.m4a',
  platformOS: 'ios',
  osVersion: '18.4.1',
  modelName: 'iPhone 17 Pro',
};

describe('buildWordUploadRequest fields', () => {
  it('maps every field the contract requires', () => {
    expect(buildWordUploadRequest(baseInput).fields).toEqual({
      client_word_id: 'wentry-1',
      firebase_anon_uid: 'uid-1',
      label: '안녕',
      device_platform: 'iOS',
      device_os_version: '18.4.1',
      device_model: 'iPhone 17 Pro',
    });
  });

  it.each([
    ['ios', 'iOS'],
    ['android', 'Android'],
    ['web', ''],
  ])('maps platform %s to the contract value %s', (platformOS, expected) => {
    expect(buildWordUploadRequest({ ...baseInput, platformOS }).fields.device_platform).toBe(expected);
  });

  it('sends empty device fields when the device info is unavailable', () => {
    const { fields } = buildWordUploadRequest({ ...baseInput, osVersion: null, modelName: null });

    expect(fields.device_os_version).toBe('');
    expect(fields.device_model).toBe('');
  });
});

describe('buildWordUploadRequest field limits', () => {
  // 단어 이름 입력란에 길이 제한이 없어 사용자가 상한을 넘길 수 있다.
  it('truncates a label longer than 50 characters', () => {
    const label = '가'.repeat(60);

    const sent = buildWordUploadRequest({ ...baseInput, label }).fields.label;

    expect(sent).toHaveLength(50);
    expect(sent).toBe(label.slice(0, 50));
  });

  it('keeps a label of exactly 50 characters intact', () => {
    const label = '나'.repeat(50);

    expect(buildWordUploadRequest({ ...baseInput, label }).fields.label).toBe(label);
  });

  it('truncates device fields to their contract limits', () => {
    const { fields } = buildWordUploadRequest({
      ...baseInput,
      osVersion: 'v'.repeat(40),
      modelName: 'm'.repeat(40),
    });

    expect(fields.device_os_version).toHaveLength(20);
    expect(fields.device_model).toHaveLength(30);
  });
});

describe('buildWordUploadRequest url', () => {
  it('targets the plural words path', () => {
    expect(buildWordUploadRequest(baseInput).url).toBe('https://api.test/api/v1/words');
  });

  // 끝 슬래시를 그대로 이으면 `//api/v1/words` 가 되고, 서버가 404 를 주면 4xx 폐기 경로로 흐른다.
  it.each(['https://api.test/', 'https://api.test///'])('normalizes a trailing slash in %s', (apiBaseUrl) => {
    expect(buildWordUploadRequest({ ...baseInput, apiBaseUrl }).url).toBe('https://api.test/api/v1/words');
  });
});

describe('buildWordUploadRequest file', () => {
  it('names the part after the stored recording file', () => {
    expect(buildWordUploadRequest(baseInput).file).toEqual({
      uri: 'file:///abs/recordings/recording-1.m4a',
      name: 'recording-1.m4a',
      type: 'audio/x-m4a',
    });
  });

  it.each([
    ['recording.m4a', 'audio/x-m4a'],
    ['recording.wav', 'audio/wav'],
    ['recording.mp3', 'audio/mpeg'],
    ['recording.aac', 'audio/aac'],
    ['recording.bin', 'application/octet-stream'],
  ])('derives the mime type of %s as %s', (fileName, expected) => {
    const audioUri = `file:///abs/${fileName}`;

    expect(buildWordUploadRequest({ ...baseInput, audioUri }).file.type).toBe(expected);
  });

  it('falls back to a default name when the uri has no file segment', () => {
    expect(buildWordUploadRequest({ ...baseInput, audioUri: 'file:///' }).file.name).toBe('reference-audio.m4a');
  });
});
