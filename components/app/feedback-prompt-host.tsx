import { useFeedback } from '@/features/feedback/feedback-context';

import { FeedbackPromptDialog } from './feedback-prompt-dialog';

/**
 * 홈(세션 설정 탭)에 마운트되어, 스케줄러가 팝업을 요청하면(`promptVisible`) 주기 팝업을 띄운다.
 * [남기기]는 팝업을 닫고 폼(루트 `FeedbackFormGate`)을 연다.
 */
export function FeedbackPromptHost() {
  const { promptVisible, dismissPrompt, openForm } = useFeedback();

  if (!promptVisible) {
    return null;
  }

  return <FeedbackPromptDialog onDismiss={dismissPrompt} onWriteFeedback={() => openForm('prompt')} />;
}
