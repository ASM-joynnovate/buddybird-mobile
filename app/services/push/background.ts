import { Platform } from 'react-native';

import { getIsHeadless as getMessagingIsHeadless, getMessaging } from '@react-native-firebase/messaging';

/** iOS에서 푸시 메시지 수신을 위해 앱이 백그라운드로 실행됐는지 확인하는 함수 */
export const getIsHeadless = () =>
	// Android는 백그라운드 메시지를 App을 띄우지 않는 별도 Headless JS 작업에서 받으므로 항상 false
	Platform.OS === 'ios' ? getMessagingIsHeadless(getMessaging()) : Promise.resolve(false);
