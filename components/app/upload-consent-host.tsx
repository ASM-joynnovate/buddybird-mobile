import { useUploadConsent } from '@/features/upload-consent/upload-consent-context';

import { UploadConsentDialog } from './upload-consent-dialog';

/**
 * 홈(세션 설정 탭)에 마운트되어 오디오 수집 동의 팝업을 띄운다.
 * 표출 순서 게이트(스플래시 해제 → 업데이트 → 동의)는 `UploadConsentProvider` 가 판정한다.
 */
export function UploadConsentHost() {
  const { promptVisible, decide } = useUploadConsent();

  if (!promptVisible) {
    return null;
  }

  return <UploadConsentDialog onGrant={() => decide('granted')} onDeny={() => decide('denied')} />;
}
