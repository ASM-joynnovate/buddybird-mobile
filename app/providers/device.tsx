import { type ReactNode, useEffect } from 'react';

import { AppState, Platform } from 'react-native';

import { useRecordDeviceActivity, useRegisterDevice, useUpdatePushToken } from '@/hooks/apis/devices';

import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';
import dayjs from 'dayjs';
import * as Device from 'expo-device';

import { DEVICE_ACTIVITY_INTERVAL_MS, MAX_DEVICE_MODEL_LENGTH, MAX_DEVICE_OS_VERSION_LENGTH } from '@/config';
import { installedVersion } from '@/services/device/application';
import { readPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 기기 등록 요청에 보낼 이 기기의 정보 */
const thisDeviceInfo = () => ({
	client_device_id: useAccountStore.getState().clientDeviceId ?? '',
	platform: Platform.OS,
	os_version: (Device.osVersion ?? '').slice(0, MAX_DEVICE_OS_VERSION_LENGTH),
	model: (Device.modelName ?? '').slice(0, MAX_DEVICE_MODEL_LENGTH),
	app_version: installedVersion,
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	locale: useDeviceSettingsStore.getState().locale,
});

interface Props {
	children: ReactNode;
}

/**
 * 기기 등록 provider
 * @param children 감싸는 내용
 */
const DeviceProvider = ({ children }: Props) => {
	const { isSuccess: deviceRegistered, mutate: registerDevice } = useRegisterDevice();
	const { mutate: updatePushToken } = useUpdatePushToken();
	const { mutate: recordDeviceActivity } = useRecordDeviceActivity();

	const serverUserId = useAccountStore((state) => state.serverUserId);

	/** 서버 사용자 ID 변경 시 기기 등록 */
	useEffect(() => {
		if (!serverUserId) {
			return;
		}

		registerDevice({ data: thisDeviceInfo() }, { onError: (error) => reportError(error, 'device_register') });
	}, [serverUserId, registerDevice]);

	/** 기기 등록 성공 시 푸시 토큰 저장 */
	useEffect(() => {
		if (!deviceRegistered) {
			return;
		}

		const savePushToken = (scope: string) => {
			void readPushToken()
				.then((token) => {
					if (token) {
						updatePushToken({ data: { token } }, { onError: (error) => reportError(error, scope) });
					}
				})
				.catch((error) => reportError(error, scope));
		};

		const unsubscribe = onTokenRefresh(getMessaging(), () => savePushToken('push_token'));

		savePushToken('push_registration');

		return unsubscribe;
	}, [deviceRegistered, updatePushToken]);

	/** foreground에서 주기마다 접속 기록 */
	useEffect(() => {
		if (!deviceRegistered) {
			return;
		}

		// 기기 등록이 첫 접속 기록
		let activityRecordedAt = dayjs().valueOf();
		let activityTimer: ReturnType<typeof setTimeout> | undefined;

		/** 다음 접속 기록 예약 함수 */
		const scheduleActivityRecord = () => {
			const nextRecordAt = activityRecordedAt + DEVICE_ACTIVITY_INTERVAL_MS;

			activityTimer = setTimeout(
				() => {
					activityRecordedAt = dayjs().valueOf();

					recordDeviceActivity({});

					scheduleActivityRecord();
				},
				Math.max(0, nextRecordAt - dayjs().valueOf()),
			);
		};

		/** 앱이 foreground일 때만 접속 기록 예약 */
		const toggleActivityRecord = (appState: string) => {
			clearTimeout(activityTimer);

			if (appState === 'active') {
				scheduleActivityRecord();
			}
		};

		toggleActivityRecord(AppState.currentState);

		const appStateSubscription = AppState.addEventListener('change', toggleActivityRecord);

		return () => {
			clearTimeout(activityTimer);
			appStateSubscription.remove();
		};
	}, [deviceRegistered, recordDeviceActivity]);

	return <>{children}</>;
};

export default DeviceProvider;
