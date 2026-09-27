import { AudioModule } from "expo-audio"
import * as ImagePicker from "expo-image-picker"
import * as Notifications from "expo-notifications"

export type PermissionKind = "microphone" | "notifications" | "photos" | "camera"

export type PermissionState = { granted: boolean; canAskAgain: boolean }

const readers: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.getRecordingPermissionsAsync(),
	notifications: () => Notifications.getPermissionsAsync(),
	photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
	camera: () => ImagePicker.getCameraPermissionsAsync(),
}

const requesters: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.requestRecordingPermissionsAsync(),
	notifications: () => Notifications.requestPermissionsAsync(),
	photos: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
	camera: () => ImagePicker.requestCameraPermissionsAsync(),
}

export async function readPermission(kind: PermissionKind): Promise<PermissionState> {
	const { granted, canAskAgain } = await readers[kind]()

	return { granted, canAskAgain }
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
	const { granted, canAskAgain } = await requesters[kind]()

	return { granted, canAskAgain }
}
