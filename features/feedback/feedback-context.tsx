import * as Application from 'expo-application';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { toLocalDateKey } from '@/features/shared/date-utils';

import {
  advanceAfterResponse,
  createInitialSchedulerState,
  currentThreshold,
  registerActiveDay,
  shouldPrompt,
} from './feedback-scheduler';
import { loadSchedulerState, saveSchedulerState } from './feedback-storage';
import { submitFeedback } from './feedback-submit';
import type { FeedbackSource, PromptSchedulerState } from './feedback-types';

export type FeedbackSubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface FeedbackContextValue {
  /** 주기 팝업이 떠 있어야 하는가(홈 host 가 렌더). */
  promptVisible: boolean;
  /** 피드백 폼이 열린 진입점. null 이면 폼 닫힘. */
  formSource: FeedbackSource | null;
  submitStatus: FeedbackSubmitStatus;
  /** 접속일을 재평가(cold start·foreground 복귀 시 tracker 가 호출). */
  evaluateActiveDay: () => void;
  /** 팝업 [닫기] — 카운트 리셋·전진 후 팝업을 닫는다(거절로 집계). */
  dismissPrompt: () => void;
  openForm: (source: FeedbackSource) => void;
  closeForm: () => void;
  submit: (message: string) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * 피드백 팝업 스케줄러 상태와 폼 노출을 소유하는 Provider. 진입점이 두 곳(홈 팝업·프로필 버튼)이라
 * 상태 공유가 필요해 단일 훅 대신 Provider 로 둔다. 로직 판정은 순수 `feedback-scheduler` 에,
 * 영속은 `feedback-storage` 에, Firestore write 는 `feedback-submit` 에 위임한다.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { track } = useAnalytics();
  const { locale } = useI18n();

  // 스케줄러 상태·노출 여부는 렌더 밖 로직에서도 읽어야 해 ref 로 미러링한다(콜백 안정성 유지).
  const stateRef = useRef<PromptSchedulerState>(createInitialSchedulerState());
  const hydratedRef = useRef(false);
  const promptVisibleRef = useRef(false);
  const formSourceRef = useRef<FeedbackSource | null>(null);

  const [promptVisible, setPromptVisibleState] = useState(false);
  const [formSource, setFormSourceState] = useState<FeedbackSource | null>(null);
  const [submitStatus, setSubmitStatus] = useState<FeedbackSubmitStatus>('idle');

  const setPromptVisible = useCallback((visible: boolean) => {
    promptVisibleRef.current = visible;
    setPromptVisibleState(visible);
  }, []);

  const setFormSource = useCallback((source: FeedbackSource | null) => {
    formSourceRef.current = source;
    setFormSourceState(source);
  }, []);

  const persist = useCallback((next: PromptSchedulerState) => {
    stateRef.current = next;
    void saveSchedulerState(next).catch((error: unknown) =>
      reportError(error, { scope: 'feedback.saveSchedulerState' })
    );
  }, []);

  const evaluateActiveDay = useCallback(() => {
    if (!hydratedRef.current) return;

    const next = registerActiveDay(stateRef.current, toLocalDateKey(new Date()));
    if (next !== stateRef.current) {
      persist(next);
    }

    // 이미 팝업/폼이 떠 있으면 중복 노출·중복 analytics 를 피한다.
    if (shouldPrompt(next) && !promptVisibleRef.current && formSourceRef.current === null) {
      setPromptVisible(true);
      track({ name: 'feedback_prompt_shown', params: { threshold: currentThreshold(next) } });
    }
  }, [persist, setPromptVisible, track]);

  // 스케줄러 상태를 1회 로드(hydrate)한다. cold start 의 접속일 반영과 팝업 판정은
  // 스플래시가 사라져 홈이 보이는 순간 `AppSplashGate` 가 evaluateActiveDay 로 트리거한다
  // (부팅 중 스플래시 뒤에서 팝업이 미리 떠 있다가 드러나던 문제 방지).
  // 로드가 실패해도(AsyncStorage I/O 등) 초기 상태로 기능은 계속 동작하도록 degrade 하고,
  // hydratedRef 는 반드시 세워 evaluateActiveDay 가 영구히 no-op 이 되지 않게 한다.
  useEffect(() => {
    let isMounted = true;
    loadSchedulerState()
      .then((loaded) => {
        if (isMounted) {
          stateRef.current = loaded;
        }
      })
      .catch((error: unknown) => {
        reportError(error, { scope: 'feedback.loadSchedulerState' });
      })
      .finally(() => {
        if (!isMounted) return;
        hydratedRef.current = true;
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const consumePrompt = useCallback(() => {
    if (!promptVisibleRef.current) return;

    persist(advanceAfterResponse(stateRef.current));
    setPromptVisible(false);
  }, [persist, setPromptVisible]);

  const dismissPrompt = useCallback(() => {
    track({ name: 'feedback_prompt_dismissed', params: { threshold: currentThreshold(stateRef.current) } });
    consumePrompt();
  }, [consumePrompt, track]);

  const openForm = useCallback(
    (source: FeedbackSource) => {
      setSubmitStatus('idle');
      setFormSource(source);
      if (source === 'prompt') {
        consumePrompt();
      }
    },
    [consumePrompt, setFormSource]
  );

  const closeForm = useCallback(() => {
    setFormSource(null);
    setSubmitStatus('idle');
  }, [setFormSource]);

  const submit = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (trimmed.length === 0) return;

      const source = formSourceRef.current ?? 'profile';
      setSubmitStatus('submitting');

      try {
        await submitFeedback({
          message: trimmed,
          appVersion: Application.nativeApplicationVersion ?? 'unknown',
          platform: Platform.OS,
          locale,
        });
        track({ name: 'feedback_submitted', params: { source, message_length: trimmed.length } });
        setSubmitStatus('success');
      } catch (error: unknown) {
        reportError(error, { scope: 'feedback.submit' });
        setSubmitStatus('error');
      }
    },
    [locale, track]
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      promptVisible,
      formSource,
      submitStatus,
      evaluateActiveDay,
      dismissPrompt,
      openForm,
      closeForm,
      submit,
    }),
    [promptVisible, formSource, submitStatus, evaluateActiveDay, dismissPrompt, openForm, closeForm, submit]
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackContextValue {
  const value = use(FeedbackContext);
  if (!value) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return value;
}
