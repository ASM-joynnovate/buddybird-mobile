// 단어 1건의 multipart 전송 I/O (SPEC-0002 §단어 업로드).
// 무엇을 보낼지는 request 모듈이 정하고, 여기서는 기기 정보를 읽어 넘기고 전송만 한다.
// 판정 로직은 갖지 않는다 — 상태 코드를 그대로 반환하고 해석은 response 모듈이 한다.

import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { postUploadForm } from '@/features/shared/upload-transport';

import { buildWordUploadRequest } from './word-upload-request';
import type { WordUploadHttpResult } from './word-upload-response';

// 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힐 수 있다.
// 기준 음성은 녹음 상한 60초라 1MB 안팎이며, 저속망 전송을 감안한 상한이다.
export const WORD_UPLOAD_TIMEOUT_MS = 30_000;

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
  const request = buildWordUploadRequest({
    ...input,
    platformOS: Platform.OS,
    osVersion: Device.osVersion,
    modelName: Device.modelName,
  });

  const form = new FormData();
  for (const [name, value] of Object.entries(request.fields)) {
    form.append(name, value);
  }
  // RN 의 FormData 파일 파트는 DOM 타입에 없어 단언이 필요하다.
  form.append('audio_file', request.file as unknown as Blob);

  // 본문(`error_code`) 읽기까지 타임아웃 창 안에서 돈다 — 헤더만 주고 멎는 서버에
  // flush 가 잡히면 다음 트리거가 전부 예약만 되고 실행되지 않는다.
  const result = await postUploadForm<WordUploadHttpResult>({
    url: request.url,
    form,
    timeoutMs: WORD_UPLOAD_TIMEOUT_MS,
    scope: 'word-library.upload.network',
    readResponse: async (response) => ({
      status: response.status,
      errorCode: await readErrorCode(response),
    }),
  });

  return result ?? { status: null, errorCode: null };
}

/**
 * 거부 응답의 `error_code` 를 읽는다. 파일 문제 3가지가 전부 400 이라
 * 상태 코드만으로는 원인을 가를 수 없다 (SPEC-0002 §단어 업로드).
 *
 * 성공 응답은 형식이 달라 `error_code` 가 없으므로 4xx 에서만 읽는다.
 * 프록시가 준 HTML 처럼 JSON 이 아닌 본문도 오므로 파싱 실패는 null 로 흡수한다.
 */
async function readErrorCode(response: Response): Promise<string | null> {
  if (response.status < 400 || response.status >= 500) return null;

  try {
    const body: unknown = await response.json();
    const code = (body as { error_code?: unknown } | null)?.error_code;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}
