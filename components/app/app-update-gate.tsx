import { useAppUpdate } from '@/features/app-update/hooks/use-app-update';

import { UpdatePromptDialog } from './update-prompt-dialog';

/**
 * 앱 실행/포그라운드 복귀 시 업데이트 프롬프트를 판정하고, 필요 시 다이얼로그를 띄운다.
 * `AppOpenTracker` 처럼 `_layout` 에 형제로 마운트되는 부트스트랩 컴포넌트다.
 */
export function AppUpdateGate() {
  const { prompt, dismiss, openStore } = useAppUpdate();

  if (!prompt) {
    return null;
  }

  return <UpdatePromptDialog prompt={prompt} onCancel={dismiss} onUpdate={openStore} />;
}
