import { useAppUpdateContext } from '@/features/app-update/app-update-context';
import { useUploadConsent } from '@/features/upload-consent/hooks/use-upload-consent';

import { UploadConsentDialog } from './upload-consent-dialog';

/**
 * 홈(세션 설정 탭)에 마운트되어 오디오 수집 동의 팝업을 띄운다.
 * 팝업 우선순위는 업데이트 → 수집 동의 → 피드백이라, 업데이트 프롬프트가 떠 있으면 기다린다.
 */
export function UploadConsentHost() {
  const { prompt } = useAppUpdateContext();
  const { shouldPrompt, decide } = useUploadConsent();

  if (prompt !== null || !shouldPrompt) {
    return null;
  }

  return <UploadConsentDialog onGrant={() => decide('granted')} onDeny={() => decide('denied')} />;
}
