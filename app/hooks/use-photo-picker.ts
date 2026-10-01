import { useState } from 'react';

import { Platform } from 'react-native';

import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';

import { MAX_UPLOAD_BYTES, PHOTO_MIME_TYPES } from '@/config';
import { reportError } from '@/services/telemetry/client';

const PHOTO_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: ['images'],
	allowsEditing: true,
	quality: 0.85,
};

/** 사진의 MIME 형식을 반환하는 함수 */
const photoMimeType = (asset: ImagePicker.ImagePickerAsset) => {
	if (asset.mimeType) {
		return asset.mimeType;
	}

	const extension = asset.uri.split('.').pop()?.toLowerCase();

	return extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';
};

/** 사진 선택 Hook */
const usePhotoPicker = (initialPhotoUri: string | null) => {
	const { t } = useTranslation();

	const [photoUri, setPhotoUri] = useState(initialPhotoUri);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const libraryPermission = usePermission('photos');
	const cameraPermission = usePermission('camera');

	/** 사진 선택 함수 */
	const pick = async (source: 'camera' | 'library') => {
		// 카메라가 없는 iOS 시뮬레이터에서 카메라를 열면 앱이 종료되므로 오류 문구만 표시
		if (Platform.OS === 'ios' && source === 'camera' && !Device.isDevice) {
			setErrorMessage(t('common.profilePhoto.loadError'));

			return;
		}

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
		} catch (e) {
			reportError(e, 'photo_picker');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	};

	/** 사진 촬영 함수 */
	const take = async () => {
		try {
			await cameraPermission.run(() => void pick('camera'));
		} catch (e) {
			reportError(e, 'camera_permission');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	};

	/** 앨범에서 사진 선택 함수 */
	const choose = async () => {
		try {
			await libraryPermission.run(() => void pick('library'));
		} catch (e) {
			reportError(e, 'photo_permission');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	};

	return {
		photoUri,
		setPhotoUri: (uri: string | null) => {
			setPhotoUri(uri);
			setErrorMessage(null);
		},
		take,
		choose,
		errorMessage,
		libraryDialog: libraryPermission.dialog,
		cameraDialog: cameraPermission.dialog,
	};
};

export default usePhotoPicker;
