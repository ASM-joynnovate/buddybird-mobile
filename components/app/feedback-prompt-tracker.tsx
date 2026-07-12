import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useFeedback } from '@/features/feedback/feedback-context';

/**
 * foreground 복귀 시 접속일을 재평가한다(cold start 는 `FeedbackProvider` hydrate 가 처리).
 * `AppOpenTracker` 와 동일한 AppState 전이 감지 패턴으로, 관심사 분리를 위해 별도 컴포넌트로 둔다.
 */
export function FeedbackPromptTracker() {
  const { evaluateActiveDay } = useFeedback();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState.match(/inactive|background/) && nextState === 'active') {
        evaluateActiveDay();
      }
    });

    return () => subscription.remove();
  }, [evaluateActiveDay]);

  return null;
}
