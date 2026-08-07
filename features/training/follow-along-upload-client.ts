// 캡처 배치의 zip 조립과 multipart 전송 I/O (SPEC-0002 §클립 업로드).
// 판정 로직은 갖지 않는다 — 상태·본문을 그대로 반환하고 해석은 response 모듈이 한다.

import * as Device from 'expo-device';
import { Directory, File, Paths } from 'expo-file-system';
import { zipSync } from 'fflate';
import { Platform } from 'react-native';

import { buildDeviceContractFields, buildUploadUrl } from '@/features/shared/upload-contract';
import { postUploadForm } from '@/features/shared/upload-transport';

import type { FollowAlongCapture } from './follow-along-capture-types';
import type { CaptureUploadMetadataItem } from './follow-along-upload-batch';
import type { CaptureBatchHttpResult } from './follow-along-upload-response';

const UPLOAD_TMP_DIR_NAME = 'capture-upload';

// STORE 는 1MB×10건이 배치 상한(10MB)을 넘을 수 있어 저레벨 deflate 로 압축한다.
// RN/Hermes 는 Web Worker 가 없어 zipSync(동기) 사용 — 저레벨로 JS 스레드 점유를 줄인다 (결정 ④).
const ZIP_COMPRESSION_LEVEL = 2;

// 플랫폼 fetch 기본값에 맡기면 무응답 서버에 flush 가 무기한 잡힐 수 있다 — zip ≤10MB
// 저속망 업로드를 감안한 상한. 초과 시 abort 는 네트워크 오류와 동일하게 처리된다 (halt·큐 유지).
export const CAPTURE_UPLOAD_TIMEOUT_MS = 60_000;

function getUploadTmpDirectory(): Directory {
  return new Directory(Paths.cache, UPLOAD_TMP_DIR_NAME);
}

// 이전 실행이 응답 처리 전에 죽어 남긴 zip 잔여물 청소. 신규 배치 생성 전에 호출한다.
export function cleanupCaptureUploadArtifacts(): void {
  try {
    const directory = getUploadTmpDirectory();
    if (directory.exists) directory.delete();
  } catch (error: unknown) {
    console.warn('[training.captureUpload.cleanup]', error);
  }
}

export interface SendCaptureBatchInput {
  apiBaseUrl: string;
  uid: string;
  /** metadata 와 같은 순서·길이 — file_name 이 zip 항목 이름이 된다 */
  batch: readonly FollowAlongCapture[];
  metadata: readonly CaptureUploadMetadataItem[];
}

export interface SendCaptureBatchOutcome {
  /** 전송이 실제 발생했으면 HTTP 결과. 읽을 수 있는 파일이 없어 전송을 건너뛰었으면 null */
  http: CaptureBatchHttpResult | null;
  /** zip 에 담겨 실제 전송된 캡처 id — 응답 해석은 이 목록 기준 */
  sentIds: string[];
  /** 읽기 실패로 제외된 캡처 id — "파일 없음"과 동일하게 삭제해 큐 고착을 막는다 */
  unreadableIds: string[];
}

// 파일 읽기(파일 단위 방어) → zip 생성 → POST → 상태/본문 반환. zip 임시 파일은
// 성공·실패와 무관하게 삭제한다. 네트워크 오류(응답 없음)는 status: null 로 반환하고
// 여기서 throw 하지 않는다.
export async function sendCaptureBatch(input: SendCaptureBatchInput): Promise<SendCaptureBatchOutcome> {
  const { entries, sentIds, sentMetadata, unreadableIds } = readBatchEntries(input.batch, input.metadata);
  if (sentIds.length === 0) return { http: null, sentIds, unreadableIds };

  const zipFile = writeBatchZip(entries);
  try {
    const http = await postCaptureBatch(input, sentMetadata, zipFile);
    return { http, sentIds, unreadableIds };
  } finally {
    try {
      if (zipFile.exists) zipFile.delete();
    } catch (error: unknown) {
      console.warn('[training.captureUpload.zipDelete]', error);
    }
  }
}

// 손상 URI·eviction 레이스 등으로 읽기에 실패한 파일이 배치 전체(나아가 flush 전체)를
// 죽이지 않도록 파일 단위로 감싼다 — 실패분은 unreadableIds 로 돌려 호출부가 삭제한다.
function readBatchEntries(
  batch: readonly FollowAlongCapture[],
  metadata: readonly CaptureUploadMetadataItem[],
): {
  entries: Record<string, Uint8Array>;
  sentIds: string[];
  sentMetadata: CaptureUploadMetadataItem[];
  unreadableIds: string[];
} {
  const entries: Record<string, Uint8Array> = {};
  const sentIds: string[] = [];
  const sentMetadata: CaptureUploadMetadataItem[] = [];
  const unreadableIds: string[] = [];
  batch.forEach((capture, index) => {
    try {
      entries[metadata[index].file_name] = new File(capture.uri).bytesSync();
      sentIds.push(capture.id);
      sentMetadata.push(metadata[index]);
    } catch (error: unknown) {
      console.warn('[training.captureUpload.readFile]', error);
      unreadableIds.push(capture.id);
    }
  });
  return { entries, sentIds, sentMetadata, unreadableIds };
}

function writeBatchZip(entries: Record<string, Uint8Array>): File {
  const zipped = zipSync(entries, { level: ZIP_COMPRESSION_LEVEL });

  const directory = getUploadTmpDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const zipFile = new File(directory, `captures-${Date.now()}.zip`);
  zipFile.write(zipped);
  return zipFile;
}

async function postCaptureBatch(
  input: SendCaptureBatchInput,
  sentMetadata: readonly CaptureUploadMetadataItem[],
  zipFile: File,
): Promise<CaptureBatchHttpResult> {
  const form = new FormData();
  form.append('firebase_anon_uid', input.uid);
  // 배치 단위 필드라 상한 초과는 단건 분할로도 회복 불가(같은 값이 다시 붙음), 4xx 폐기 경로로 증폭된다.
  const device = buildDeviceContractFields({
    platformOS: Platform.OS,
    osVersion: Device.osVersion,
    modelName: Device.modelName,
  });
  form.append('device_platform', device.device_platform);
  form.append('device_os_version', device.device_os_version);
  form.append('device_model', device.device_model);
  form.append('metadata', JSON.stringify(sentMetadata));
  form.append('file', {
    uri: zipFile.uri,
    name: 'captures.zip',
    type: 'application/zip',
    // RN 의 FormData 파일 파트는 DOM 타입에 없어 단언이 필요하다.
  } as unknown as Blob);

  // 본문 읽기까지 타임아웃 창 안에서 돈다 — 헤더만 주고 멎는 서버에 flush 가 잡히면
  // 큐가 그대로 남은 채 다음 트리거가 계속 헛돈다.
  const result = await postUploadForm<CaptureBatchHttpResult>({
    url: buildUploadUrl(input.apiBaseUrl, '/api/v1/captures'),
    form,
    timeoutMs: CAPTURE_UPLOAD_TIMEOUT_MS,
    scope: 'training.captureUpload.network',
    readResponse: async (response) => ({ status: response.status, body: await readJsonBody(response) }),
  });

  return result ?? { status: null, body: null };
}

// 본문 없는/비JSON 응답(프록시가 준 HTML 등)도 온다 — 파싱 실패는 null 로 흡수하고
// 상태 코드만으로 해석한다.
async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
