// 캡처 업로드 게이트 3조건 판정 (SPEC-0003 §오디오 클립 업로드). 순수 함수 — I/O 없음.

import type { UploadConsentStatus } from '@/features/upload-consent/upload-consent-storage';

export interface UploadGateInput {
  consentStatus: UploadConsentStatus;
  /** Firebase 익명 uid. 미확보면 null */
  uid: string | null;
  /** app config `extra.apiBaseUrl`. 미설정이면 null — 게이트 닫힘 = 업로드 꺼짐 */
  apiBaseUrl: string | null;
}

export function isUploadGateOpen(input: UploadGateInput): boolean {
  return input.consentStatus === 'granted' && !!input.uid && !!input.apiBaseUrl;
}
