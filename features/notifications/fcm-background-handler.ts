import { setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import { getBuddyBirdMessaging } from './fcm-client';
import { recordFcmMessageReceipt } from './fcm-storage';

setBackgroundMessageHandler(getBuddyBirdMessaging(), async (message) => {
  try {
    await recordFcmMessageReceipt(message, 'background');
  } catch (error: unknown) {
    console.warn('[notifications.backgroundMessage]', error);
  }
});
