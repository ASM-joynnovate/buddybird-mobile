import { AudioModule } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import notifee, { AuthorizationStatus, type NotificationSettings } from 'react-native-notify-kit';

export type PermissionKind = 'microphone' | 'notifications' | 'photos' | 'camera';

export interface PermissionState {
	granted: boolean;
	canAskAgain: boolean;
}

/** 알림 설정을 권한 상태로 바꾸는 함수 */
const notificationPermissionOf = ({ authorizationStatus }: NotificationSettings) => ({
	granted: authorizationStatus >= AuthorizationStatus.AUTHORIZED,
	// 한 번이라도 거부하면 설정 안내
	canAskAgain: authorizationStatus === AuthorizationStatus.NOT_DETERMINED,
});

const readers: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.getRecordingPermissionsAsync(),
	notifications: async () => notificationPermissionOf(await notifee.getNotificationSettings()),
	photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
	camera: () => ImagePicker.getCameraPermissionsAsync(),
};

const requesters: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.requestRecordingPermissionsAsync(),
	notifications: async () => notificationPermissionOf(await notifee.requestPermission()),
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
