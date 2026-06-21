import { Directory, File, Paths } from 'expo-file-system';

import { isPresetUri } from './audio-source-resolver';
import type { StableRecordingFile } from './audio-types';

const RECORDINGS_DIR_NAME = 'recordings';
const STORED_URI_PREFIX = 'recording://';

export async function persistRecordingFile(sourceUri: string, nowIso: string): Promise<StableRecordingFile> {
  const recordingsDirectory = getRecordingsDirectory();
  recordingsDirectory.create({ idempotent: true, intermediates: true });

  const fileName = `recording-${sanitizeIsoForFileName(nowIso)}.${getFileExtension(sourceUri)}`;
  const sourceFile = new File(sourceUri);
  const stableFile = new File(recordingsDirectory, fileName);

  sourceFile.copy(stableFile);

  return {
    fileName,
    uri: stableFile.uri,
  };
}

// AsyncStorage에는 컨테이너 UUID가 포함된 절대 URI 대신 fileName만 저장한다.
// iOS Simulator는 재빌드 시 컨테이너 UUID가 바뀌므로 절대 URI는 stale 상태가 된다.
export function normalizeAudioUriForStorage(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  if (isPresetUri(uri) || uri.startsWith(STORED_URI_PREFIX)) return uri;
  const fileName = extractRecordingFileName(uri);
  return fileName ? `${STORED_URI_PREFIX}${fileName}` : uri;
}

// 저장형 URI(`recording://<name>`)를 현재 Documents 경로 기준의 절대 file:// URI로 변환.
// preset://, 절대경로(file://), 외부 URI는 그대로 통과.
export function hydrateAudioUriFromStorage(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  if (uri.startsWith(STORED_URI_PREFIX)) {
    const fileName = uri.slice(STORED_URI_PREFIX.length);
    if (!fileName) return uri;
    return resolveRecordingUri(fileName);
  }
  return uri;
}

// entry 한 건에서 "선언된 오디오 URI 필드"에만 변환을 적용한다.
// 문자열·undefined 외 값은 건드리지 않고, 변경이 없으면 원본 참조를 그대로 반환한다.
// 필수 필드(값이 항상 존재)와 옵셔널 필드(undefined 가능) 모두 `transform(uri) ?? uri`
// 동일 idiom으로 처리된다 — normalize/hydrate는 비대상 URI를 그대로 통과시키므로 안전.
// 필드명에 `.` 이 있으면 중첩 경로로 해석한다 (예: `pitchTransform.transformedUri`).
type AudioUriFieldTransform = (uri: string | undefined) => string | undefined;

function transformAudioUriFields<T extends Record<string, unknown>>(
  entry: T,
  fields: readonly string[],
  transform: AudioUriFieldTransform,
): T {
  let acc: Record<string, unknown> = entry;

  for (const field of fields) {
    const path = field.includes('.') ? field.split('.') : [field];
    acc = applyAudioUriFieldPath(acc, path, transform);
  }

  return acc === entry ? entry : (acc as T);
}

// 경로의 leaf 필드에만 변환을 적용한다. 경로상의 비객체·비대상 값은 통과시키며,
// 변경이 없으면 각 단계에서 원본 참조를 그대로 반환한다(불변 보장).
function applyAudioUriFieldPath(
  obj: Record<string, unknown>,
  path: readonly string[],
  transform: AudioUriFieldTransform,
): Record<string, unknown> {
  const [head, ...rest] = path;
  const current = obj[head];

  if (rest.length === 0) {
    if (current !== undefined && typeof current !== 'string') return obj;
    const transformed = transform(current) ?? current;
    if (transformed === current) return obj;
    return { ...obj, [head]: transformed };
  }

  if (!current || typeof current !== 'object') return obj;
  const child = current as Record<string, unknown>;
  const nextChild = applyAudioUriFieldPath(child, rest, transform);
  if (nextChild === child) return obj;
  return { ...obj, [head]: nextChild };
}

// save 직전: 선언된 필드들을 `recording://<name>` 형태로 정규화.
export function normalizeAudioUriFields<T extends Record<string, unknown>>(
  entry: T,
  fields: readonly string[],
): T {
  return transformAudioUriFields(entry, fields, normalizeAudioUriForStorage);
}

// load 직후: 선언된 필드들을 현재 documents 경로 기준 절대 URI로 복원.
export function hydrateAudioUriFields<T extends Record<string, unknown>>(
  entry: T,
  fields: readonly string[],
): T {
  return transformAudioUriFields(entry, fields, hydrateAudioUriFromStorage);
}

export function resolveRecordingUri(fileName: string): string {
  return new File(getRecordingsDirectory(), fileName).uri;
}

// 재생 직전 파일 존재 여부 검사. 절대 URI / 저장형 URI 둘 다 처리.
// preset:// 등 비파일 URI는 검사 대상 아님 → true 반환.
export function recordingFileExists(uri: string | null | undefined): boolean {
  if (!uri) return false;
  if (isPresetUri(uri)) return true;
  const absoluteUri = uri.startsWith(STORED_URI_PREFIX) ? hydrateAudioUriFromStorage(uri) : uri;
  if (!absoluteUri || !absoluteUri.startsWith('file://')) return true;
  try {
    return new File(absoluteUri).exists;
  } catch {
    return false;
  }
}

function extractRecordingFileName(uri: string): string | null {
  if (!uri.startsWith('file://')) return null;
  const recordingsSegment = `/${RECORDINGS_DIR_NAME}/`;
  const idx = uri.lastIndexOf(recordingsSegment);
  if (idx === -1) return null;
  const fileName = uri.slice(idx + recordingsSegment.length).split('?')[0];
  return fileName.length > 0 ? fileName : null;
}

function getRecordingsDirectory(): Directory {
  return new Directory(Paths.document, RECORDINGS_DIR_NAME);
}

function sanitizeIsoForFileName(value: string): string {
  return value.replace(/[:.]/g, '-');
}

function getFileExtension(uri: string): string {
  const extension = uri.split('?')[0]?.split('.').pop();
  return extension && extension.length <= 5 ? extension : 'm4a';
}
