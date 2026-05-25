import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getInitialNotification,
  getIsHeadless,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type Messaging,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type { FcmAuthorizationState, FcmRegistration } from './fcm-types';
import { recordFcmMessageReceipt, saveFcmRegistration } from './fcm-storage';

export function getBuddyBirdMessaging(): Messaging {
  return getMessaging(getApp());
}

export async function getFcmHeadlessLaunchStatus(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  return getIsHeadless(getBuddyBirdMessaging());
}

export async function ensureFcmRegistration(): Promise<FcmRegistration> {
  const messaging = getBuddyBirdMessaging();
  const authorizationStatus = await requestFcmAuthorization(messaging);
  const canReceiveMessages =
    authorizationStatus === 'authorized' || authorizationStatus === 'provisional';

  const registration: FcmRegistration = {
    authorizationStatus,
    token: canReceiveMessages ? await getToken(messaging) : null,
    updatedAt: new Date().toISOString(),
  };

  await saveFcmRegistration(registration);
  return registration;
}

export function subscribeToFcmMessages(): () => void {
  const messaging = getBuddyBirdMessaging();
  const unsubscribeForeground = onMessage(messaging, async (message) => {
    try {
      await recordFcmMessageReceipt(message, 'foreground');
    } catch (error: unknown) {
      console.warn('[notifications.foregroundMessage]', error);
    }
  });
  const unsubscribeOpened = onNotificationOpenedApp(messaging, async (message) => {
    try {
      await recordFcmMessageReceipt(message, 'notification_opened');
    } catch (error: unknown) {
      console.warn('[notifications.openedMessage]', error);
    }
  });
  const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (token) => {
    try {
      await saveFcmRegistration({
        authorizationStatus: await getCurrentFcmAuthorization(messaging),
        token,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.warn('[notifications.tokenRefresh]', error);
    }
  });

  void getInitialNotification(messaging)
    .then((message) => {
      if (message) {
        return recordFcmMessageReceipt(message, 'notification_opened');
      }
      return undefined;
    })
    .catch((error: unknown) => {
      console.warn('[notifications.initialMessage]', error);
    });

  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
    unsubscribeTokenRefresh();
  };
}

async function requestFcmAuthorization(messaging: Messaging): Promise<FcmAuthorizationState> {
  if (Platform.OS === 'android') {
    if (!shouldRequestAndroidPostNotificationsPermission()) {
      return 'authorized';
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'authorized' : 'denied';
  }

  if (Platform.OS === 'ios') {
    return mapFirebaseAuthorizationStatus(await requestPermission(messaging));
  }

  return 'denied';
}

async function getCurrentFcmAuthorization(messaging: Messaging): Promise<FcmAuthorizationState> {
  if (Platform.OS === 'android') {
    if (!shouldRequestAndroidPostNotificationsPermission()) {
      return 'authorized';
    }

    return (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS))
      ? 'authorized'
      : 'denied';
  }

  if (Platform.OS === 'ios') {
    return mapFirebaseAuthorizationStatus(await hasPermission(messaging));
  }

  return 'denied';
}

function shouldRequestAndroidPostNotificationsPermission(): boolean {
  const apiLevel = Number(Platform.Version);
  return !Number.isFinite(apiLevel) || apiLevel >= 33;
}

function mapFirebaseAuthorizationStatus(status: number): FcmAuthorizationState {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return 'authorized';
    case AuthorizationStatus.PROVISIONAL:
      return 'provisional';
    case AuthorizationStatus.EPHEMERAL:
      return 'ephemeral';
    case AuthorizationStatus.NOT_DETERMINED:
      return 'not_determined';
    case AuthorizationStatus.DENIED:
    default:
      return 'denied';
  }
}
