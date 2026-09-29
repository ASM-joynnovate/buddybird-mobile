import { type ReactNode, useEffect } from 'react';

import { Platform } from 'react-native';

import { useRegisterDevice } from '@/hooks/apis/devices';

import * as Device from 'expo-device';

import { MAX_DEVICE_MODEL_LENGTH, MAX_DEVICE_OS_VERSION_LENGTH } from '@/config';
import { installedVersion } from '@/services/device/application';
import { startPushTokenSync } from '@/services/push/token-sync';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';

/** 기기 등록 요청에 보낼 이 기기의 정보 */
const thisDeviceInfo = () => ({
	client_device_id: useAccountStore.getState().clientDeviceId ?? '',
	platform: Platform.OS,
	os_version: (Device.osVersion ?? '').slice(0, MAX_DEVICE_OS_VERSION_LENGTH),
	model: (Device.modelName ?? '').slice(0, MAX_DEVICE_MODEL_LENGTH),
	app_version: installedVersion,
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

interface Props {
	children: ReactNode;
}

/**
 * 기기 등록 provider
 * @param children 감싸는 내용
 */
const DeviceProvider = ({ children }: Props) => {
	const { isSuccess, mutate } = useRegisterDevice();

	const serverUserId = useAccountStore((state) => state.serverUserId);

	/** 서버 사용자 ID 변경 시 기기 등록 */
	useEffect(() => {
		if (!serverUserId) {
			return;
		}

		mutate({ data: thisDeviceInfo() }, { onError: (error) => reportError(error, 'device_register') });
	}, [serverUserId, mutate]);

	/** 기기 등록 성공 시 푸시 토큰 동기화 시작 */
	useEffect(() => {
		if (!isSuccess) {
			return;
		}

		return startPushTokenSync();
	}, [isSuccess]);

	return <>{children}</>;
};

export default DeviceProvider;
