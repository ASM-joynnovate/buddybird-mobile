import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

export const UPLOAD_CONSENT_STORAGE_KEY = '@buddybird/upload-consent';

/**
 * 발성 오디오를 서버로 보내 보관하는 것에 대한 동의 상태.
 * analytics 의 ATT 추적 동의(`features/analytics/consent.ts`)와는 별개다.
 */
export type UploadConsentStatus = 'unknown' | 'granted' | 'denied';

export interface UploadConsentRecord {
  status: UploadConsentStatus;
  /** 최종 결정 시각(ISO 8601). 미결정이면 `null` */
  decidedAt: string | null;
  /** 결정 당시 사용자가 본 안내 문구 버전. 미결정이면 0 */
  noticeVersion: number;
}

const FALLBACK: UploadConsentRecord = { status: 'unknown', decidedAt: null, noticeVersion: 0 };

const STATUSES: readonly string[] = ['unknown', 'granted', 'denied'];

// 깨진 기록을 동의로 취급하느니 다시 묻는다 — parse 가 throw 하면 seam 이 보고 후 fallback.
const store = persistKeyedStore<UploadConsentRecord>({
  key: UPLOAD_CONSENT_STORAGE_KEY,
  scope: 'upload-consent.loadRecord',
  parse: parseRecord,
  fallback: () => ({ ...FALLBACK }),
});

export async function loadUploadConsent(): Promise<UploadConsentRecord> {
  return store.load();
}

export async function saveUploadConsentDecision(
  status: Exclude<UploadConsentStatus, 'unknown'>,
  noticeVersion: number,
  decidedAt: Date = new Date(),
): Promise<void> {
  await store.save({ status, decidedAt: decidedAt.toISOString(), noticeVersion });
}

function parseRecord(raw: unknown): UploadConsentRecord {
  if (!raw || typeof raw !== 'object') {
    throw new Error('upload consent record is not an object');
  }

  const value = raw as Partial<UploadConsentRecord>;

  if (typeof value.status !== 'string' || !STATUSES.includes(value.status)) {
    throw new Error(`invalid upload consent status: ${String(value.status)}`);
  }

  if (typeof value.noticeVersion !== 'number' || !Number.isFinite(value.noticeVersion)) {
    throw new Error(`invalid upload consent noticeVersion: ${String(value.noticeVersion)}`);
  }

  return {
    status: value.status,
    decidedAt: parseDecidedAt(value.decidedAt),
    noticeVersion: value.noticeVersion,
  };
}

function parseDecidedAt(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    throw new Error(`invalid upload consent decidedAt: ${String(value)}`);
  }

  return value;
}
