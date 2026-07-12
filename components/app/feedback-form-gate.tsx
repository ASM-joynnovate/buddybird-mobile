import { useFeedback } from '@/features/feedback/feedback-context';

import { FeedbackFormDialog } from './feedback-form-dialog';

/**
 * 루트에 마운트되는 피드백 폼 게이트. 팝업의 [남기기]와 프로필 탭 진입점이 공유하며,
 * `formSource`가 있을 때만 폼을 렌더한다(어느 화면에서 열었든 동일하게 동작).
 */
export function FeedbackFormGate() {
  const { formSource, submitStatus, submit, closeForm } = useFeedback();

  if (formSource === null) {
    return null;
  }

  return <FeedbackFormDialog status={submitStatus} onSubmit={submit} onClose={closeForm} />;
}
