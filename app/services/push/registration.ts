import { getMessaging, getToken } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

/** 알림 권한이 있으면 FCM 토큰을 반환하는 함수 */
export const readPushToken = async () => {
	const permission = await Notifications.getPermissionsAsync();

	if (!permission.granted) {
		return null;
	}

	return getToken(getMessaging());
};
