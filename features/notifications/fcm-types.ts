export type FcmAuthorizationState =
  | 'not_determined'
  | 'denied'
  | 'authorized'
  | 'provisional'
  | 'ephemeral';

export type FcmMessageReceiptSource = 'foreground' | 'background' | 'notification_opened';

export interface FcmRegistration {
  token: string | null;
  authorizationStatus: FcmAuthorizationState;
  updatedAt: string;
}

export interface FcmMessageReceipt {
  messageId: string | null;
  from: string | null;
  sentTime: number | null;
  source: FcmMessageReceiptSource;
  receivedAt: string;
}
