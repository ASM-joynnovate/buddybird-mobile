// 단어 업로드 요청의 구성 (SPEC-0002 §단어 업로드 — 요청값). 순수 함수 — I/O 없음.
// 무엇을 어디로 보낼지만 정하고, 실제 전송은 client 가 한다.

// 서버 계약(SPEC-0002)의 필드 상한(코드포인트 기준). 클라이언트가 초과분을 잘라 400 을 예방한다 —
// 400 은 영구 `failed` 로 굳어 그 단어가 다시 올라가지 않는다.
// label 은 사용자 입력이고 단어 이름 입력란에 길이 제한이 없어 실제로 초과할 수 있다.
// 앱 안의 단어 이름은 그대로 두고 서버에 보내는 값만 자른다.
const LABEL_MAX_LENGTH = 50;
const DEVICE_OS_VERSION_MAX_LENGTH = 20;
const DEVICE_MODEL_MAX_LENGTH = 30;

export interface WordUploadRequestInput {
  apiBaseUrl: string;
  uid: string;
  clientWordId: string;
  label: string;
  /** 기준 음성 원본 파일의 절대 경로 (hydrate 된 값) */
  audioUri: string;
  /** `Platform.OS` 값 */
  platformOS: string;
  /** `expo-device` 가 읽은 값. 읽지 못했으면 null */
  osVersion: string | null;
  modelName: string | null;
}

export interface WordUploadRequest {
  url: string;
  /** multipart 텍스트 필드 */
  fields: Record<string, string>;
  /** multipart 파일 파트 */
  file: { uri: string; name: string; type: string };
}

export function buildWordUploadRequest(input: WordUploadRequestInput): WordUploadRequest {
  return {
    url: buildWordUploadUrl(input.apiBaseUrl),
    fields: {
      client_word_id: input.clientWordId,
      firebase_anon_uid: input.uid,
      label: truncateToCodePoints(input.label, LABEL_MAX_LENGTH),
      device_platform: resolveDevicePlatform(input.platformOS),
      device_os_version: truncateToCodePoints(input.osVersion ?? '', DEVICE_OS_VERSION_MAX_LENGTH),
      device_model: truncateToCodePoints(input.modelName ?? '', DEVICE_MODEL_MAX_LENGTH),
    },
    file: {
      uri: input.audioUri,
      name: resolveFileName(input.audioUri),
      type: resolveMimeType(input.audioUri),
    },
  };
}

// 코드포인트 기준으로 자른다. `slice` 는 UTF-16 코드 유닛 기준이라 상한이 이모지 한가운데
// 걸리면 서로게이트 페어를 쪼개 lone surrogate 를 남기고, 그 값은 UTF-8 로 U+FFFD 가 되어
// 서버에 깨진 라벨이 저장된다. 서버 계약의 상한도 코드포인트 기준이다.
function truncateToCodePoints(value: string, maxLength: number): string {
  const codePoints = Array.from(value);
  return codePoints.length <= maxLength ? value : codePoints.slice(0, maxLength).join('');
}

// base URL 끝 슬래시를 정규화한다 — `//api/v1/words` 는 서버가 404 를 줄 수 있고,
// 404 는 4xx 경로로 흘러 설정 실수 하나가 단어 전량의 영구 실패로 증폭된다.
function buildWordUploadUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/api/v1/words`;
}

function resolveFileName(uri: string): string {
  const name = uri.split('?')[0]?.split('/').pop();
  return name && name.length > 0 ? name : 'reference-audio.m4a';
}

// 서버는 파일 내용으로 타입을 감지하므로 이 값은 참고용이다.
// 확장자에서 유도하고, 모르는 확장자는 서버 감지에 맡긴다.
function resolveMimeType(uri: string): string {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (extension === 'm4a') return 'audio/x-m4a';
  if (extension === 'mp4') return 'audio/mp4';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'aac') return 'audio/aac';
  return 'application/octet-stream';
}

// 서버 계약은 `iOS or Android` (SPEC-0002) — Platform.OS 소문자 값을 매핑한다.
function resolveDevicePlatform(platformOS: string): string {
  if (platformOS === 'ios') return 'iOS';
  if (platformOS === 'android') return 'Android';
  return '';
}
