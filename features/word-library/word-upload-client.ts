// 단어 1건의 multipart 전송 I/O (SPEC-0002 §단어 업로드).
// 무엇을 보낼지는 request 모듈이 정하고, 여기서는 기기 정보를 읽어 넘기고 전송만 한다.
// 판정 로직은 갖지 않는다 — 상태 코드를 그대로 반환하고 해석은 response 모듈이 한다.

import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { buildWordUploadRequest } from './word-upload-request';
import type { WordUploadHttpResult } from './word-upload-response';

// 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힐 수 있다.
// 기준 음성은 녹음 상한 60초라 1MB 안팎이며, 저속망 전송을 감안한 상한이다.
const WORD_UPLOAD_TIMEOUT_MS = 30_000;

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

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), WORD_UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(request.url, {
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
