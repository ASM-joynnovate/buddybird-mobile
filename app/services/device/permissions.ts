import { AudioModule } from "expo-audio"
import * as ImagePicker from "expo-image-picker"
import * as Notifications from "expo-notifications"

export type PermissionKind = "microphone" | "camera" | "notifications" | "photos"

export type PermissionState = { granted: boolean; canAskAgain: boolean }

const readers: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.getRecordingPermissionsAsync(),
	camera: () => ImagePicker.getCameraPermissionsAsync(),
	notifications: () => Notifications.getPermissionsAsync(),
	photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
}

const requesters: Record<PermissionKind, () => Promise<PermissionState>> = {
	microphone: () => AudioModule.requestRecordingPermissionsAsync(),
	camera: () => ImagePicker.requestCameraPermissionsAsync(),
	notifications: () => Notifications.requestPermissionsAsync(),
	photos: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
}

export async function readPermission(kind: PermissionKind): Promise<PermissionState> {
	const { granted, canAskAgain } = await readers[kind]()

	return { granted, canAskAgain }
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
	const { granted, canAskAgain } = await requesters[kind]()

	return { granted, canAskAgain }
}
