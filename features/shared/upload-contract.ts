// 수집 서버 업로드의 공통 계약 매핑 (SPEC-0002). 순수 함수 — I/O 없음.
// 단어·클립 업로드가 공유하는 값·규칙만 두고, 무엇을 언제 보낼지는 각 파이프라인이 소유한다.

import { truncateToCodePoints } from './text-truncate';

/** 서버 계약(SPEC-0002)의 기기 필드 상한(코드포인트 기준). 두 파이프라인이 같은 값을 보낸다. */
const DEVICE_OS_VERSION_MAX_LENGTH = 20;
const DEVICE_MODEL_MAX_LENGTH = 30;

export interface DeviceContractInput {
  /** `Platform.OS` 값 */
  platformOS: string;
  /** `expo-device` 가 읽은 값. 읽지 못했으면 null */
  osVersion: string | null;
  modelName: string | null;
}

/** 계약 그대로의 multipart 텍스트 필드. snake_case 는 서버 계약. */
export interface DeviceContractFields {
  device_platform: string;
  device_os_version: string;
  device_model: string;
}

// 기기 3종 필드는 두 업로드가 완전히 같은 값을 보낸다 — 상한도 플랫폼 매핑도 여기에만 둔다.
export function buildDeviceContractFields(input: DeviceContractInput): DeviceContractFields {
  return {
    device_platform: resolveDevicePlatform(input.platformOS),
    device_os_version: truncateToCodePoints(input.osVersion ?? '', DEVICE_OS_VERSION_MAX_LENGTH),
    device_model: truncateToCodePoints(input.modelName ?? '', DEVICE_MODEL_MAX_LENGTH),
  };
}

// base URL 끝 슬래시를 정규화해 잇는다 — `//api/v1/words` 는 서버가 404 를 줄 수 있고,
// 404 는 4xx 경로(단어 거부·캡처 폐기)로 흘러 설정 실수 하나가 전량 손실로 증폭된다.
export function buildUploadUrl(apiBaseUrl: string, path: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}${path}`;
}

// 서버 계약은 `iOS or Android` (SPEC-0002) — Platform.OS 소문자 값을 매핑한다.
function resolveDevicePlatform(platformOS: string): string {
  if (platformOS === 'ios') return 'iOS';
  if (platformOS === 'android') return 'Android';
  return '';
}
