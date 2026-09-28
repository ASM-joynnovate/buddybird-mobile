import { useState } from 'react';

import { type PermissionDialogState, usePermission } from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import * as ImagePicker from 'expo-image-picker';

import { MAX_UPLOAD_BYTES, PHOTO_MIME_TYPES } from '@/config';
import { reportError } from '@/services/telemetry/client';

const PHOTO_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: ['images'],
	allowsEditing: true,
	quality: 0.85,
};

function photoType(asset: ImagePicker.ImagePickerAsset) {
	if (asset.mimeType) {
		return asset.mimeType;
	}

	const extension = asset.uri.split('.').pop()?.toLowerCase();

	return extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';
}

export function usePhotoPicker(initial: string | null): {
	photoUri: string | null;
	setPhotoUri(uri: string | null): void;
	take(): Promise<void>;
	choose(): Promise<void>;
	error: string | null;
	libraryDialog: PermissionDialogState;
	cameraDialog: PermissionDialogState;
} {
	const { t } = useTranslation();

	const [photoUri, setPhotoUri] = useState(initial);
	const [error, setError] = useState<string | null>(null);

	const libraryPermission = usePermission('photos');
	const cameraPermission = usePermission('camera');

	async function pick(source: 'camera' | 'library') {
		try {
			const result =
				source === 'camera'
					? await ImagePicker.launchCameraAsync(PHOTO_PICKER_OPTIONS)
					: await ImagePicker.launchImageLibraryAsync(PHOTO_PICKER_OPTIONS);

			if (result.canceled) {
				return;
			}

			const asset = result.assets[0];

			if (!PHOTO_MIME_TYPES.includes(photoType(asset))) {
				setError(t('entry.parrot.photoType'));
			} else if ((asset.fileSize ?? 0) > MAX_UPLOAD_BYTES) {
				setError(t('entry.parrot.photoSize'));
			} else {
				setPhotoUri(asset.uri);
				setError(null);
			}
		} catch (cause) {
			reportError(cause, 'photo_picker');

			setError(t('entry.parrot.photoError'));
		}
	}

	async function take() {
		try {
			await cameraPermission.run(() => void pick('camera'));
		} catch (cause) {
			reportError(cause, 'camera_permission');

			setError(t('entry.parrot.photoError'));
		}
	}

	async function choose() {
		try {
			await libraryPermission.run(() => void pick('library'));
		} catch (cause) {
			reportError(cause, 'photo_permission');

			setError(t('entry.parrot.photoError'));
		}
	}

	return {
		photoUri,
		setPhotoUri: (uri) => {
			setPhotoUri(uri);
			setError(null);
		},
		take,
		choose,
		error,
		libraryDialog: libraryPermission.dialog,
		cameraDialog: cameraPermission.dialog,
	};
}
