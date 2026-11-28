import { requireOptionalNativeModule } from 'expo';

interface AudioModeNative {
	setCommunicationMode: (enabled: boolean) => void;
}

/** Android에만 있음 */
export const AudioMode = requireOptionalNativeModule<AudioModeNative>('AudioMode');
