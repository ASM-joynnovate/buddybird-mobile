import { diffDaysIso } from '@/features/shared/date-utils';

import type { UploadConsentRecord } from './upload-consent-storage';

export const UPLOAD_CONSENT_REPROMPT_DAYS = 30;

/**
 * 콜드 스타트에서 동의 팝업을 띄울지 판정한다.
 * 미결정이면 표출하고, 거부는 30일이 지나면 다시 표출한다. 안내 문구 버전은 판정에 쓰지 않는다.
 */
export function shouldShowUploadConsentNotice(
  record: UploadConsentRecord,
  nowMs: number = Date.now(),
): boolean {
  if (record.status === 'granted') {
    return false;
  }

  if (record.status === 'unknown' || record.decidedAt === null) {
    return true;
  }

  return diffDaysIso(record.decidedAt, nowMs) >= UPLOAD_CONSENT_REPROMPT_DAYS;
}
