import { setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { getBuddyBirdMessaging } from './fcm-client';
import { recordFcmMessageReceipt } from './fcm-storage';

if (Platform.OS !== 'web') {
  setBackgroundMessageHandler(getBuddyBirdMessaging(), async (message) => {
    try {
      await recordFcmMessageReceipt(message, 'background');
    } catch (error: unknown) {
      console.warn('[notifications.backgroundMessage]', error);
    }
  });
}
