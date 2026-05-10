import { Directory, File, Paths } from 'expo-file-system';

import type { StableRecordingFile } from './audio-types';

export async function persistRecordingFile(sourceUri: string, nowIso: string): Promise<StableRecordingFile> {
  const recordingsDirectory = new Directory(Paths.document, 'recordings');
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

function sanitizeIsoForFileName(value: string): string {
  return value.replace(/[:.]/g, '-');
}

function getFileExtension(uri: string): string {
  const extension = uri.split('?')[0]?.split('.').pop();
  return extension && extension.length <= 5 ? extension : 'm4a';
}
