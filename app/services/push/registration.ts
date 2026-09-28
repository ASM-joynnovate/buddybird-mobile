import { putPushToken } from '@/apis/devices';

import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';

/** 알림 권한이 있으면 이 기기의 푸시 토큰을 서버에 저장 */
export const sendPushToken = async () => {
	const permission = await Notifications.getPermissionsAsync();

	if (!permission.granted) {
		return;
	}

	const token = await getToken(getMessaging());

	await putPushToken({ data: { token }, idempotencyKey: randomUUID() });
};
