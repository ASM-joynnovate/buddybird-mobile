import { Platform } from 'react-native';

import { getIsHeadless as getMessagingIsHeadless, getMessaging } from '@react-native-firebase/messaging';

// Android background messages run in a separate Headless JS task without mounting App.
export const getIsHeadless = () =>
	Platform.OS === 'ios' ? getMessagingIsHeadless(getMessaging()) : Promise.resolve(false);
