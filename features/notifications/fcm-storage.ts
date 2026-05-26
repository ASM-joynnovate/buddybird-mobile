import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RemoteMessage } from '@react-native-firebase/messaging';

import type { FcmMessageReceipt, FcmMessageReceiptSource, FcmRegistration } from './fcm-types';

export const FCM_REGISTRATION_STORAGE_KEY = '@buddybird/fcm-registration';
export const FCM_MESSAGE_RECEIPTS_STORAGE_KEY = '@buddybird/fcm-message-receipts';

const MAX_STORED_RECEIPTS = 20;

export async function saveFcmRegistration(registration: FcmRegistration): Promise<void> {
  await AsyncStorage.setItem(FCM_REGISTRATION_STORAGE_KEY, JSON.stringify(registration));
}

export async function loadFcmRegistration(): Promise<FcmRegistration | null> {
  const rawRegistration = await AsyncStorage.getItem(FCM_REGISTRATION_STORAGE_KEY);

  if (!rawRegistration) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawRegistration);
    return isFcmRegistration(parsed) ? parsed : null;
  } catch (error: unknown) {
    console.warn('[notifications.loadRegistration]', error);
    return null;
  }
}

export async function recordFcmMessageReceipt(
  message: RemoteMessage,
  source: FcmMessageReceiptSource
): Promise<void> {
  const receipt: FcmMessageReceipt = {
    messageId: message.messageId ?? null,
    from: message.from ?? null,
    sentTime: message.sentTime ?? null,
    source,
    receivedAt: new Date().toISOString(),
  };

  const receipts = await loadFcmMessageReceipts();
  const updated = [receipt, ...receipts].slice(0, MAX_STORED_RECEIPTS);
  await AsyncStorage.setItem(FCM_MESSAGE_RECEIPTS_STORAGE_KEY, JSON.stringify(updated));
}

export async function loadFcmMessageReceipts(): Promise<readonly FcmMessageReceipt[]> {
  const rawReceipts = await AsyncStorage.getItem(FCM_MESSAGE_RECEIPTS_STORAGE_KEY);

  if (!rawReceipts) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawReceipts);
    return Array.isArray(parsed) ? parsed.filter(isFcmMessageReceipt) : [];
  } catch (error: unknown) {
    console.warn('[notifications.loadReceipts]', error);
    return [];
  }
}

function isFcmRegistration(value: unknown): value is FcmRegistration {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const registration = value as Partial<FcmRegistration>;

  return (
    (typeof registration.token === 'string' || registration.token === null) &&
    isFcmAuthorizationState(registration.authorizationStatus) &&
    typeof registration.updatedAt === 'string'
  );
}

function isFcmMessageReceipt(value: unknown): value is FcmMessageReceipt {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const receipt = value as Partial<FcmMessageReceipt>;

  return (
    (typeof receipt.messageId === 'string' || receipt.messageId === null) &&
    (typeof receipt.from === 'string' || receipt.from === null) &&
    (typeof receipt.sentTime === 'number' || receipt.sentTime === null) &&
    isFcmMessageReceiptSource(receipt.source) &&
    typeof receipt.receivedAt === 'string'
  );
}

function isFcmAuthorizationState(value: unknown): value is FcmRegistration['authorizationStatus'] {
  return (
    value === 'not_determined' ||
    value === 'denied' ||
    value === 'authorized' ||
    value === 'provisional' ||
    value === 'ephemeral'
  );
}

function isFcmMessageReceiptSource(value: unknown): value is FcmMessageReceiptSource {
  return value === 'foreground' || value === 'background' || value === 'notification_opened';
}
