import { registerPushToken } from '@/apis/devices';

import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';

export async function sendPushToken(): Promise<void> {
	const permission = await Notifications.getPermissionsAsync();

	if (!permission.granted) {
		return;
	}

	const token = await getToken(getMessaging());

	await registerPushToken(token, randomUUID());
}
