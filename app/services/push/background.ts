import { Platform } from 'react-native';

import { getIsHeadless as getMessagingIsHeadless, getMessaging } from '@react-native-firebase/messaging';

/** iOS가 푸시 메시지를 받으려고 앱을 백그라운드에서 실행했는지 여부 */
export const getIsHeadless = () =>
	// Android는 백그라운드 메시지를 App을 띄우지 않는 별도 Headless JS 작업에서 받으므로 항상 false
	Platform.OS === 'ios' ? getMessagingIsHeadless(getMessaging()) : Promise.resolve(false);
