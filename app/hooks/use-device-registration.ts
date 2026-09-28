import { useEffect } from 'react';

import { Platform } from 'react-native';

import type { RegisterDeviceRequest } from '@/types/apis/devices';

import { useRegisterDevice } from '@/hooks/apis/devices';

import * as Device from 'expo-device';

import { MAX_DEVICE_MODEL_LENGTH, MAX_DEVICE_OS_VERSION_LENGTH } from '@/config';
import { installedVersion } from '@/services/device/application';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';

function thisDeviceInfo(): RegisterDeviceRequest {
	return {
		client_device_id: useAccountStore.getState().clientDeviceId ?? '',
		platform: Platform.OS,
		os_version: (Device.osVersion ?? '').slice(0, MAX_DEVICE_OS_VERSION_LENGTH),
		model: (Device.modelName ?? '').slice(0, MAX_DEVICE_MODEL_LENGTH),
		app_version: installedVersion,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};
}

export function useDeviceRegistration(): boolean {
	const { isSuccess, mutate } = useRegisterDevice();

	const serverUserId = useAccountStore((account) => account.serverUserId);

	useEffect(() => {
		if (!serverUserId) {
			return;
		}

		mutate({ data: thisDeviceInfo() }, { onError: (error) => reportError(error, 'device_register') });
	}, [serverUserId, mutate]);

	return isSuccess;
}
