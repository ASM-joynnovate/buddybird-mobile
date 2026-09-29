import { AudioModule } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

export type PermissionKind = 'microphone' | 'notifications' | 'photos' | 'camera';

export interface PermissionState {
	granted: boolean;
	canAskAgain: boolean;
}

const readers: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.getRecordingPermissionsAsync(),
	notifications: () => Notifications.getPermissionsAsync(),
	photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
	camera: () => ImagePicker.getCameraPermissionsAsync(),
};

const requesters: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.requestRecordingPermissionsAsync(),
	notifications: () => Notifications.requestPermissionsAsync(),
	photos: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
	camera: () => ImagePicker.requestCameraPermissionsAsync(),
};

/** 권한 상태를 반환하는 함수 */
export const readPermission = async (kind: PermissionKind) => {
	const { granted, canAskAgain } = await readers[kind]();

	return { granted, canAskAgain };
};

/** 권한 요청 함수 */
export const requestPermission = async (kind: PermissionKind) => {
	const { granted, canAskAgain } = await requesters[kind]();

	return { granted, canAskAgain };
};
