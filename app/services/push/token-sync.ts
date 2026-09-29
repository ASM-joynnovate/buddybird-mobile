import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';

import { sendPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';

/** 푸시 토큰 동기화 시작 함수 */
export const startPushTokenSync = () => {
	const unsubscribe = onTokenRefresh(getMessaging(), () => {
		void sendPushToken().catch((error) => reportError(error, 'push_token'));
	});

	void sendPushToken().catch((error) => reportError(error, 'push_registration'));

	return unsubscribe;
};
