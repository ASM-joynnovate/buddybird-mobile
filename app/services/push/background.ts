import { Platform } from 'react-native';

import { getIsHeadless as getMessagingIsHeadless, getMessaging } from '@react-native-firebase/messaging';

/** 백그라운드 실행 여부 확인 함수 */
export const getIsHeadless = () =>
	// Android는 Headless JS에서 처리
	Platform.OS === 'ios' ? getMessagingIsHeadless(getMessaging()) : Promise.resolve(false);
