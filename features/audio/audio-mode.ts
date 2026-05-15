import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { Platform } from 'react-native';

export async function configureRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
  await setIsAudioActiveAsync(true);
}

export async function configurePlaybackAudioMode(): Promise<void> {
  if (Platform.OS === 'ios') {
    await setIsAudioActiveAsync(false).catch(() => {});
  }
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
  });
  await setIsAudioActiveAsync(true);
}
