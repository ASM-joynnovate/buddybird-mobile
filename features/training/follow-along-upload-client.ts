// 캡처 배치의 zip 조립과 multipart 전송 I/O (SPEC-0002 §클립 업로드).
// 판정 로직은 갖지 않는다 — 상태·본문을 그대로 반환하고 해석은 response 모듈이 한다.

import * as Device from 'expo-device';
import { Directory, File, Paths } from 'expo-file-system';
import { zipSync } from 'fflate';
import { Platform } from 'react-native';

import type { FollowAlongCapture } from './follow-along-capture-types';
import type { CaptureUploadMetadataItem } from './follow-along-upload-batch';
import type { CaptureBatchHttpResult } from './follow-along-upload-response';

const UPLOAD_TMP_DIR_NAME = 'capture-upload';

// STORE 는 1MB×10건이 배치 상한(10MB)을 넘을 수 있어 저레벨 deflate 로 압축한다.
// RN/Hermes 는 Web Worker 가 없어 zipSync(동기) 사용 — 저레벨로 JS 스레드 점유를 줄인다 (결정 ④).
const ZIP_COMPRESSION_LEVEL = 2;

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

// zip 생성 → POST → 상태/본문 반환. zip 임시 파일은 성공·실패와 무관하게 삭제한다.
// 네트워크 오류(응답 없음)는 status: null 로 반환하고 여기서 throw 하지 않는다.
export async function sendCaptureBatch(input: SendCaptureBatchInput): Promise<CaptureBatchHttpResult> {
  const zipFile = createBatchZip(input.batch, input.metadata);
  try {
    const response = await postCaptureBatch(input, zipFile);
    return response;
  } finally {
    try {
      if (zipFile.exists) zipFile.delete();
    } catch (error: unknown) {
      console.warn('[training.captureUpload.zipDelete]', error);
    }
  }
}

function createBatchZip(
  batch: readonly FollowAlongCapture[],
  metadata: readonly CaptureUploadMetadataItem[],
): File {
  const entries: Record<string, Uint8Array> = {};
  batch.forEach((capture, index) => {
    entries[metadata[index].file_name] = new File(capture.uri).bytesSync();
  });
  const zipped = zipSync(entries, { level: ZIP_COMPRESSION_LEVEL });

  const directory = getUploadTmpDirectory();
  directory.create({ idempotent: true, intermediates: true });
  const zipFile = new File(directory, `captures-${Date.now()}.zip`);
  zipFile.write(zipped);
  return zipFile;
}

async function postCaptureBatch(
  input: SendCaptureBatchInput,
  zipFile: File,
): Promise<CaptureBatchHttpResult> {
  const form = new FormData();
  form.append('firebase_anon_uid', input.uid);
  form.append('device_platform', resolveDevicePlatform());
  form.append('device_os_version', Device.osVersion ?? '');
  form.append('device_model', Device.modelName ?? '');
  form.append('metadata', JSON.stringify(input.metadata));
  form.append('file', {
    uri: zipFile.uri,
    name: 'captures.zip',
    type: 'application/zip',
    // RN 의 FormData 파일 파트는 DOM 타입에 없어 단언이 필요하다.
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(`${input.apiBaseUrl}/api/v1/captures`, { method: 'POST', body: form });
  } catch (error: unknown) {
    console.warn('[training.captureUpload.network]', error);
    return { status: null, body: null };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null; // 본문 없는/비JSON 응답 — 상태 코드만으로 해석한다.
  }
  return { status: response.status, body };
}

// 서버 계약은 `iOS or Android` (SPEC-0002) — Platform.OS 소문자 값을 매핑한다.
function resolveDevicePlatform(): string {
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'android') return 'Android';
  return '';
}
