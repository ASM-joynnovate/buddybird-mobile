import { Asset } from 'expo-asset';
import { Directory, Paths } from 'expo-file-system';

const CAPTURE_DIRECTORY_NAME = 'session-captures';
const RECORDINGS_DIRECTORY_NAME = 'recordings';

export async function prepareSessionAudioUri(source: string | number): Promise<string> {
  if (typeof source === 'string') {
    if (!source.startsWith('file://')) {
      throw new Error(`Session audio source must be a local file URI: ${source}`);
    }
    return source;
  }

  const asset = Asset.fromModule(source);
  if (!asset.localUri) await asset.downloadAsync();
  if (!asset.localUri?.startsWith('file://')) {
    throw new Error(`Could not prepare session audio asset: ${asset.name}`);
  }
  return asset.localUri;
}

export function prepareSessionCaptureDirectoryUri(): string {
  const directory = new Directory(Paths.document, RECORDINGS_DIRECTORY_NAME, CAPTURE_DIRECTORY_NAME);
  directory.create({ intermediates: true, idempotent: true });
  return directory.uri;
}
