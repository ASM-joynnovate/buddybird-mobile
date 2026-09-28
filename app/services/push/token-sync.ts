import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';

import { sendPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';

/** 푸시 토큰을 서버에 보내고 토큰이 바뀔 때마다 다시 보내기 */
export const startPushTokenSync = () => {
	const unsubscribe = onTokenRefresh(getMessaging(), () => {
		void sendPushToken().catch((error) => reportError(error, 'push_token'));
	});

	void sendPushToken().catch((error) => reportError(error, 'push_registration'));

	return unsubscribe;
};
