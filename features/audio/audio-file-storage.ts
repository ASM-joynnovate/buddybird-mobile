import { Directory, File, Paths } from 'expo-file-system';

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
  if (uri.startsWith('preset://') || uri.startsWith(STORED_URI_PREFIX)) return uri;
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

export function resolveRecordingUri(fileName: string): string {
  return new File(getRecordingsDirectory(), fileName).uri;
}

// 재생 직전 파일 존재 여부 검사. 절대 URI / 저장형 URI 둘 다 처리.
// preset:// 등 비파일 URI는 검사 대상 아님 → true 반환.
export function recordingFileExists(uri: string | null | undefined): boolean {
  if (!uri) return false;
  if (uri.startsWith('preset://')) return true;
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
