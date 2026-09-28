import { useState } from 'react';

import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import * as ImagePicker from 'expo-image-picker';

import { MAX_UPLOAD_BYTES, PHOTO_MIME_TYPES } from '@/config';
import { reportError } from '@/services/telemetry/client';

const PHOTO_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: ['images'],
	allowsEditing: true,
	quality: 0.85,
};

/** 사진의 MIME 형식, 없으면 파일 확장자로 찾은 형식 */
const photoMimeType = (asset: ImagePicker.ImagePickerAsset) => {
	if (asset.mimeType) {
		return asset.mimeType;
	}

	const extension = asset.uri.split('.').pop()?.toLowerCase();

	return extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';
};

/** 카메라나 앨범에서 고른 사진의 형식과 크기를 확인해 사진 주소와 오류 문구를 돌려주는 훅 */
const usePhotoPicker = (initialPhotoUri: string | null) => {
	const { t } = useTranslation();

	const [photoUri, setPhotoUri] = useState(initialPhotoUri);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const libraryPermission = usePermission('photos');
	const cameraPermission = usePermission('camera');

	/** 카메라나 앨범에서 사진을 고르고 형식과 크기 확인 */
	const pick = async (source: 'camera' | 'library') => {
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

	/** 카메라 권한 확인 뒤 사진 찍기 */
	const take = async () => {
		try {
			await cameraPermission.run(() => void pick('camera'));
		} catch (e) {
			reportError(e, 'camera_permission');

			setErrorMessage(t('common.profilePhoto.loadError'));
		}
	};

	/** 사진 권한 확인 뒤 앨범에서 사진 고르기 */
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
