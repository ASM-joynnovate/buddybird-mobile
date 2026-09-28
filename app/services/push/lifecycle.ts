import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';

import { sendPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';

export function startPush(): () => void {
	const unsubscribe = onTokenRefresh(getMessaging(), () => {
		void sendPushToken().catch((error) => reportError(error, 'push_token'));
	});

	void sendPushToken().catch((error) => reportError(error, 'push_registration'));

	return unsubscribe;
}
