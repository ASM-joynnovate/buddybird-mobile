import { putPushToken } from '@/apis/devices';

import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';

/** 푸시 토큰 등록 함수 */
export const sendPushToken = async () => {
	const permission = await Notifications.getPermissionsAsync();

	if (!permission.granted) {
		return;
	}

	const token = await getToken(getMessaging());

	await putPushToken({ data: { token }, idempotencyKey: randomUUID() });
};
