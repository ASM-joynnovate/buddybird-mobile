// 캡처 배치 조립 규칙 (SPEC-0003 §배치 생성·payload 생성). 순수 함수 — I/O 없음.
// 파일 존재 여부는 predicate 로 주입받아 판정만 담당한다.

import { truncateToCodePoints } from '@/features/shared/text-truncate';

import type { FollowAlongCapture } from './follow-along-capture-types';

export const MAX_CAPTURE_BATCH_SIZE = 10;

// 서버 계약(SPEC-0002)의 zip ≤10MB 상한을 원본 합계로 보장하는 예산. WAV 는 deflate 로
// 커지지 않으므로 원본 ≤9MB → zip ≤10MB 가 성립한다 (zip 오버헤드·편차 여유 1MB).
// 동기 zipSync 의 JS 힙 점유 상한도 이 예산이 함께 묶는다.
export const MAX_CAPTURE_BATCH_BYTES = 9 * 1024 * 1024;

// 서버 계약(SPEC-0002)의 필드 상한(코드포인트 기준). 클라이언트가 초과분을 잘라 400을 예방한다.
// parrotSpecies 는 프로필의 "직접입력" 자유 문자열이라 이모지가 상한에 걸릴 수 있다.
const APP_VERSION_MAX_LENGTH = 12;
const PARROT_SPECIES_MAX_LENGTH = 50;

export interface CaptureBatchPlan {
  /** capturedAt 오래된 순 최대 10건·원본 합계 ≤9MB — 로컬 파일이 있는 레코드만 */
  batch: FollowAlongCapture[];
  /** 로컬 오디오 파일이 없는 레코드 — 전송 대상에서 제외하고 삭제한다 */
  missingFileIds: string[];
}

export function planCaptureBatch(
  captures: readonly FollowAlongCapture[],
  hasLocalFile: (capture: FollowAlongCapture) => boolean,
): CaptureBatchPlan {
  const missingFileIds: string[] = [];
  const uploadable: FollowAlongCapture[] = [];
  for (const capture of captures) {
    if (hasLocalFile(capture)) uploadable.push(capture);
    else missingFileIds.push(capture.id);
  }
  uploadable.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  const batch: FollowAlongCapture[] = [];
  let totalBytes = 0;
  for (const capture of uploadable) {
    if (batch.length >= MAX_CAPTURE_BATCH_SIZE) break;
    // 예산을 넘겨도 최소 1건은 담는다 — 단건 초과분은 서버가 rejected 로 걸러 큐가 막히지 않는다.
    if (batch.length > 0 && totalBytes + capture.sizeBytes > MAX_CAPTURE_BATCH_BYTES) break;
    batch.push(capture);
    totalBytes += capture.sizeBytes;
  }
  return { batch, missingFileIds };
}

/** `POST /api/v1/captures` 의 `metadata` 항목 (SPEC-0002 §클립 업로드). snake_case 는 서버 계약. */
export interface CaptureUploadMetadataItem {
  client_capture_id: string;
  client_word_id: string;
  client_session_id: string;
  cycle: number;
  phase: 'LE' | 'RE';
  captured_at: string;
  /** zip 안에서 이 클립의 오디오를 가리키는 이름 */
  file_name: string;
  app_version?: string;
  parrot_species?: string;
  parrot_birthdate?: string;
}

// batch 와 같은 순서로 metadata 항목을 만든다. file_name 은 레코드의 fileName 을 그대로
// zip 항목 이름으로 쓴다 — 네이티브가 session-<sessionId>-<segmentId>.wav 로 생성하고
// segmentId 가 캡처 id(스토어 맵 키)라 배치 안에서 충돌할 수 없다.
export function buildCaptureBatchMetadata(
  batch: readonly FollowAlongCapture[],
  appVersion: string | null,
): CaptureUploadMetadataItem[] {
  return batch.map((capture) => {
    const item: CaptureUploadMetadataItem = {
      client_capture_id: capture.id,
      // flush 직전 백필로 채워지지만, 만약을 대비해 원본 wordId 강등과 동일하게 폴백한다.
      client_word_id: capture.clientWordId ?? capture.wordId,
      client_session_id: capture.sessionId,
      cycle: capture.cycle,
      phase: capture.phase === 'rest' ? 'RE' : 'LE',
      captured_at: toUtcIso(capture.capturedAt),
      file_name: capture.fileName,
    };
    if (appVersion) item.app_version = truncateToCodePoints(appVersion, APP_VERSION_MAX_LENGTH);
    if (capture.parrotSpecies) {
      item.parrot_species = truncateToCodePoints(capture.parrotSpecies, PARROT_SPECIES_MAX_LENGTH);
    }
    if (capture.parrotBirthdate) item.parrot_birthdate = capture.parrotBirthdate;
    return item;
  });
}

// 저장된 ISO 를 UTC(Z) 로 정규화. 파싱 불가하면 원본 그대로 — 서버 검증에 맡긴다.
function toUtcIso(value: string): string {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? value : new Date(time).toISOString();
}
