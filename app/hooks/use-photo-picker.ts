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

function photoMimeType(asset: ImagePicker.ImagePickerAsset) {
	if (asset.mimeType) {
		return asset.mimeType;
	}

	const extension = asset.uri.split('.').pop()?.toLowerCase();

	return extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';
}

export function usePhotoPicker(initialPhotoUri: string | null): {
	photoUri: string | null;
	setPhotoUri(uri: string | null): void;
	take(): Promise<void>;
	choose(): Promise<void>;
	errorMessage: string | null;
	libraryDialog: PermissionDialogState;
	cameraDialog: PermissionDialogState;
} {
	const { t } = useTranslation();

	const [photoUri, setPhotoUri] = useState(initialPhotoUri);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const libraryPermission = usePermission('photos');
	const cameraPermission = usePermission('camera');

	async function pick(source: 'camera' | 'library') {
		try {
			const pickerResult =
				source === 'camera'
					? await ImagePicker.launchCameraAsync(PHOTO_PICKER_OPTIONS)
					: await ImagePicker.launchImageLibraryAsync(PHOTO_PICKER_OPTIONS);

			if (pickerResult.canceled) {
				return;
			}

			const asset = pickerResult.assets[0];

			if (!PHOTO_MIME_TYPES.includes(photoMimeType(asset))) {
				setErrorMessage(t('common.profilePhoto.typeError'));
			} else if ((asset.fileSize ?? 0) > MAX_UPLOAD_BYTES) {
				setErrorMessage(t('common.profilePhoto.sizeError'));
			} else {
				setPhotoUri(asset.uri);
				setErrorMessage(null);
			}
		} catch (cause) {
			reportError(cause, 'photo_picker');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	}

	async function take() {
		try {
			await cameraPermission.run(() => void pick('camera'));
		} catch (cause) {
			reportError(cause, 'camera_permission');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	}

	async function choose() {
		try {
			await libraryPermission.run(() => void pick('library'));
		} catch (cause) {
			reportError(cause, 'photo_permission');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	}

	return {
		photoUri,
		setPhotoUri: (uri) => {
			setPhotoUri(uri);
			setErrorMessage(null);
		},
		take,
		choose,
		errorMessage,
		libraryDialog: libraryPermission.dialog,
		cameraDialog: cameraPermission.dialog,
	};
}
