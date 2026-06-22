import type { RemoteMessage } from '@react-native-firebase/messaging';

import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import type { FcmMessageReceipt, FcmMessageReceiptSource, FcmRegistration } from './fcm-types';

export const FCM_REGISTRATION_STORAGE_KEY = '@buddybird/fcm-registration';
export const FCM_MESSAGE_RECEIPTS_STORAGE_KEY = '@buddybird/fcm-message-receipts';

const MAX_STORED_RECEIPTS = 20;

// 키 2개이므로 키마다 seam 인스턴스를 둔다. 손상/검증 실패는 표면화하지 않고
// 조용히 null/[] 로 복구한다(recover 미지정 → fallback). 손상 보고는 seam 의
// reportError 로 일관화된다.
const registrationStore = persistKeyedStore<FcmRegistration | null>({
  key: FCM_REGISTRATION_STORAGE_KEY,
  scope: 'notifications.loadRegistration',
  parse: (raw) => (isFcmRegistration(raw) ? raw : null),
  fallback: () => null,
});

const messageReceiptsStore = persistKeyedStore<readonly FcmMessageReceipt[]>({
  key: FCM_MESSAGE_RECEIPTS_STORAGE_KEY,
  scope: 'notifications.loadReceipts',
  parse: (raw) => (Array.isArray(raw) ? raw.filter(isFcmMessageReceipt) : []),
  fallback: () => [],
});

export async function saveFcmRegistration(registration: FcmRegistration): Promise<void> {
  await registrationStore.save(registration);
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
  await messageReceiptsStore.save(updated);
}

export async function loadFcmMessageReceipts(): Promise<readonly FcmMessageReceipt[]> {
  return messageReceiptsStore.load();
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
