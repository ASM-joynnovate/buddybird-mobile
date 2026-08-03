// 단어 1건의 multipart 전송 I/O (SPEC-0002 §단어 업로드).
// 판정 로직은 갖지 않는다 — 상태 코드를 그대로 반환하고 해석은 response 모듈이 한다.

import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { WordUploadHttpResult } from './word-upload-response';

// 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힐 수 있다.
// 기준 음성은 녹음 상한 60초라 1MB 안팎이며, 저속망 전송을 감안한 상한이다.
const WORD_UPLOAD_TIMEOUT_MS = 30_000;

// 서버 계약(SPEC-0002)의 필드 상한. 클라이언트가 초과분을 잘라 400 을 예방한다 —
// 400 은 영구 `failed` 로 굳어 그 단어가 다시 올라가지 않는다.
// label 은 사용자 입력이고 단어 이름 입력란에 길이 제한이 없어 실제로 초과할 수 있다.
// 앱 안의 단어 이름은 그대로 두고 서버에 저장되는 값만 자른다.
const LABEL_MAX_LENGTH = 50;
const DEVICE_OS_VERSION_MAX_LENGTH = 20;
const DEVICE_MODEL_MAX_LENGTH = 30;

export interface SendWordInput {
  apiBaseUrl: string;
  uid: string;
  clientWordId: string;
  label: string;
  /** 기준 음성 원본 파일의 절대 경로 (hydrate 된 값) */
  audioUri: string;
}

/**
 * 단어 1건을 서버로 보내고 HTTP 상태만 돌려준다.
 * 네트워크 오류(응답 없음)는 `status: null` 로 반환하며 여기서 throw 하지 않는다.
 */
export async function sendWord(input: SendWordInput): Promise<WordUploadHttpResult> {
  const form = new FormData();
  form.append('client_word_id', input.clientWordId);
  form.append('firebase_anon_uid', input.uid);
  form.append('label', input.label.slice(0, LABEL_MAX_LENGTH));
  form.append('device_platform', resolveDevicePlatform());
  form.append('device_os_version', (Device.osVersion ?? '').slice(0, DEVICE_OS_VERSION_MAX_LENGTH));
  form.append('device_model', (Device.modelName ?? '').slice(0, DEVICE_MODEL_MAX_LENGTH));
  form.append('audio_file', {
    uri: input.audioUri,
    name: resolveFileName(input.audioUri),
    type: resolveMimeType(input.audioUri),
    // RN 의 FormData 파일 파트는 DOM 타입에 없어 단언이 필요하다.
  } as unknown as Blob);

  // base URL 끝 슬래시를 정규화한다 — `//api/v1/words` 는 서버가 404 를 줄 수 있고,
  // 404 는 4xx 경로로 흘러 설정 실수 하나가 단어 전량의 영구 실패로 증폭된다.
  const apiBaseUrl = input.apiBaseUrl.replace(/\/+$/, '');

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), WORD_UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/words`, {
      method: 'POST',
      body: form,
      signal: abortController.signal,
    });
    return { status: response.status };
  } catch (error: unknown) {
    console.warn('[word-library.upload.network]', error);
    return { status: null };
  } finally {
    clearTimeout(timeoutId);
  }
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
function resolveDevicePlatform(): string {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return '';
}
