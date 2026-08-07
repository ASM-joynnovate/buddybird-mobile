// 단어 업로드 요청의 구성 (SPEC-0002 §단어 업로드 — 요청값). 순수 함수 — I/O 없음.
// 무엇을 어디로 보낼지만 정하고, 실제 전송은 client 가 한다.

import { truncateToCodePoints } from '@/features/shared/text-truncate';
import { buildDeviceContractFields, buildUploadUrl } from '@/features/shared/upload-contract';

// 서버 계약(SPEC-0002)의 필드 상한(코드포인트 기준). 클라이언트가 초과분을 잘라 400 을 예방한다 —
// 처리 기록을 두지 않으므로 400 을 받은 단어는 트리거마다 같은 거부를 반복한다.
// label 은 사용자 입력이고 단어 이름 입력란에 길이 제한이 없어 실제로 초과할 수 있다.
// 앱 안의 단어 이름은 그대로 두고 서버에 보내는 값만 자른다. 기기 필드 상한은 공용 모듈이 소유한다.
const LABEL_MAX_LENGTH = 50;

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
    url: buildUploadUrl(input.apiBaseUrl, '/api/v1/words'),
    fields: {
      client_word_id: input.clientWordId,
      firebase_anon_uid: input.uid,
      label: truncateToCodePoints(input.label, LABEL_MAX_LENGTH),
      // 계약이 요구하는 3개만 명시해 넘긴다 — `input` 을 통째로 넘기면 나중에 이름이 겹치는
      // 선택적 필드가 계약에 추가됐을 때 단어 쪽만 조용히 그 값을 집어 간다.
      ...buildDeviceContractFields({
        platformOS: input.platformOS,
        osVersion: input.osVersion,
        modelName: input.modelName,
      }),
    },
    file: {
      uri: input.audioUri,
      name: resolveFileName(input.audioUri),
      type: resolveMimeType(input.audioUri),
    },
  };
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
