// 요청 구성 (SPEC-0002 §단어 업로드 — 요청값). 순수 함수라 협력자 없이 입력·출력만 본다.
// 입력값은 실제 앱이 넘기는 형태 — clientWordId 는 `wentry-<ISO>-<random>`,
// audioUri 는 hydrate 된 Documents/recordings 절대 경로다.

import { buildWordUploadRequest, type WordUploadRequestInput } from '../word-upload-request';

const RECORDING_FILE_NAME = 'recording-2026-08-01T09-14-32-118Z.m4a';
const RECORDINGS_DIRECTORY =
  'file:///var/mobile/Containers/Data/Application/6F3C1E1A-2B77-4E5D-9C42-8D0B5A9E7C31/Documents/recordings';

const baseInput: WordUploadRequestInput = {
  apiBaseUrl: 'https://api.buddybird.app',
  uid: 'Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3',
  clientWordId: 'wentry-2026-08-01T09:14:32.118Z-k3n8v2qa',
  label: '사랑해',
  audioUri: `${RECORDINGS_DIRECTORY}/${RECORDING_FILE_NAME}`,
  platformOS: 'ios',
  osVersion: '18.4.1',
  modelName: 'iPhone 17 Pro',
};

describe('buildWordUploadRequest fields', () => {
  it('maps every field the contract requires', () => {
    expect(buildWordUploadRequest(baseInput).fields).toEqual({
      client_word_id: 'wentry-2026-08-01T09:14:32.118Z-k3n8v2qa',
      firebase_anon_uid: 'Xj2mQ8pLd0Zb7Nf4Rk1Ts6Vy9Cw3',
      label: '사랑해',
      device_platform: 'iOS',
      device_os_version: '18.4.1',
      device_model: 'iPhone 17 Pro',
    });
  });

  // 계약값은 `iOS`·`Android` 두 가지다 — 그 외 플랫폼은 빈 문자열로 보낸다.
  it.each([
    ['ios', 'iOS'],
    ['android', 'Android'],
    ['web', ''],
  ])('maps platform %s to the contract value %s', (platformOS, expected) => {
    expect(buildWordUploadRequest({ ...baseInput, platformOS }).fields.device_platform).toBe(expected);
  });

  it('sends empty device fields when expo-device read nothing', () => {
    const { fields } = buildWordUploadRequest({ ...baseInput, osVersion: null, modelName: null });

    expect(fields.device_os_version).toBe('');
    expect(fields.device_model).toBe('');
  });
});

describe('buildWordUploadRequest field limits', () => {
  // 단어 이름 입력란에 길이 제한이 없어 사용자가 문장을 그대로 넣을 수 있다.
  const OVERLONG_LABEL = '우리 집 앵무새 초코가 아침마다 현관에서 하는 인사말 안녕하세요 반가워요 오늘도 좋은 하루 보내세요';
  // 상한 초과는 실기기에서 드물지만, 벤더 커스텀 빌드 문자열이 넘길 수 있다.
  const VENDOR_OS_VERSION = '15.0.0_custom_vendor_build_20260801';
  const VENDOR_MODEL_NAME = 'SM-S928N Galaxy S24 Ultra 5G Enterprise Edition';

  // 초과분을 클라이언트가 자르지 않으면 400 이 오고, 그 단어는 트리거마다 같은 거부를 반복한다.
  it('truncates a label longer than the contract limit', () => {
    const { fields } = buildWordUploadRequest({ ...baseInput, label: OVERLONG_LABEL });

    expect(fields.label).toHaveLength(50);
    expect(fields.label).toBe(OVERLONG_LABEL.slice(0, 50));
  });

  it('leaves a label at exactly the contract limit intact', () => {
    const label = OVERLONG_LABEL.slice(0, 50);

    expect(buildWordUploadRequest({ ...baseInput, label }).fields.label).toBe(label);
  });

  it('truncates device fields to their contract limits', () => {
    const { fields } = buildWordUploadRequest({
      ...baseInput,
      osVersion: VENDOR_OS_VERSION,
      modelName: VENDOR_MODEL_NAME,
    });

    expect(fields.device_os_version).toBe(VENDOR_OS_VERSION.slice(0, 20));
    expect(fields.device_model).toBe(VENDOR_MODEL_NAME.slice(0, 30));
  });
});

// 상한이 이모지 한가운데 걸리는 경우. 코드 유닛 기준으로 자르면 서로게이트 페어가 쪼개져
// lone surrogate 가 남고, UTF-8 로 인코딩되며 U+FFFD 로 깨진 라벨이 서버에 저장된다.
// 단어 이름 입력란에 길이 제한이 없어 사용자가 실제로 이 경계를 만들 수 있다.
describe('buildWordUploadRequest label encoding', () => {
  const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

  it('does not split an emoji that straddles the label limit', () => {
    const label = `${'가'.repeat(49)}🦜 하고 인사하기`;

    const sent = buildWordUploadRequest({ ...baseInput, label }).fields.label;

    expect(sent).not.toMatch(LONE_SURROGATE);
    // lone surrogate 는 UTF-8 로 인코딩할 수 없어 여기서 throw 한다.
    expect(() => encodeURIComponent(sent)).not.toThrow();
    // 50번째 코드포인트가 이모지 전체다 — 쪼개는 대신 온전히 담고 그 뒤를 버린다.
    expect(sent).toBe(`${'가'.repeat(49)}🦜`);
    expect(Array.from(sent)).toHaveLength(50);
  });

  it('counts the label limit in code points, not utf-16 code units', () => {
    const label = '🦜'.repeat(60);

    const sent = buildWordUploadRequest({ ...baseInput, label }).fields.label;

    expect(Array.from(sent)).toHaveLength(50);
    expect(sent).toBe('🦜'.repeat(50));
  });

  it('keeps an emoji label that fits the limit intact', () => {
    const label = `안녕 🦜`;

    expect(buildWordUploadRequest({ ...baseInput, label }).fields.label).toBe(label);
  });

  it('applies the same code point rule to device fields', () => {
    const { fields } = buildWordUploadRequest({ ...baseInput, modelName: '📱'.repeat(40) });

    expect(fields.device_model).not.toMatch(LONE_SURROGATE);
    expect(Array.from(fields.device_model)).toHaveLength(30);
  });
});

describe('buildWordUploadRequest url', () => {
  it('targets the plural words path', () => {
    expect(buildWordUploadRequest(baseInput).url).toBe('https://api.buddybird.app/api/v1/words');
  });

  // 끝 슬래시를 그대로 이으면 `//api/v1/words` 가 되고, 서버 404 는 4xx 거부 경로로 흐른다 —
  // 설정 실수 하나로 단어 전량이 앱 실행마다 거부되고 리포팅이 쌓인다.
  it.each(['https://api.buddybird.app/', 'https://api.buddybird.app///'])(
    'normalizes the trailing slash in %s',
    (apiBaseUrl) => {
      expect(buildWordUploadRequest({ ...baseInput, apiBaseUrl }).url).toBe(
        'https://api.buddybird.app/api/v1/words',
      );
    },
  );
});

describe('buildWordUploadRequest file part', () => {
  it('names the part after the stored recording file', () => {
    expect(buildWordUploadRequest(baseInput).file).toEqual({
      uri: `${RECORDINGS_DIRECTORY}/${RECORDING_FILE_NAME}`,
      name: RECORDING_FILE_NAME,
      type: 'audio/x-m4a',
    });
  });

  // 서버는 파일 내용으로 타입을 감지한다 — 이 값은 참고용이고, 모르는 확장자는 서버에 맡긴다.
  it.each([
    ['m4a', 'audio/x-m4a'],
    ['mp4', 'audio/mp4'],
    ['wav', 'audio/wav'],
    ['mp3', 'audio/mpeg'],
    ['aac', 'audio/aac'],
    ['caf', 'application/octet-stream'],
  ])('derives the mime type of a .%s recording as %s', (extension, expected) => {
    const audioUri = `${RECORDINGS_DIRECTORY}/recording-2026-08-01T09-14-32-118Z.${extension}`;

    expect(buildWordUploadRequest({ ...baseInput, audioUri }).file.type).toBe(expected);
  });

  it('ignores a query string when reading the file name and extension', () => {
    const audioUri = `${RECORDINGS_DIRECTORY}/${RECORDING_FILE_NAME}?generation=2`;

    const { file } = buildWordUploadRequest({ ...baseInput, audioUri });

    expect(file.name).toBe(RECORDING_FILE_NAME);
    expect(file.type).toBe('audio/x-m4a');
  });

  it('falls back to a default name when the uri carries no file segment', () => {
    expect(buildWordUploadRequest({ ...baseInput, audioUri: `${RECORDINGS_DIRECTORY}/` }).file.name).toBe(
      'reference-audio.m4a',
    );
  });
});
