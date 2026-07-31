import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { reportError } from '@/features/analytics/error-reporter';
import { useAppUpdateContext } from '@/features/app-update/app-update-context';

import { shouldShowUploadConsentNotice } from './upload-consent-decision';
import { UPLOAD_CONSENT_NOTICE_VERSION } from './upload-consent-notice';
import {
  loadUploadConsent,
  saveUploadConsentDecision,
  type UploadConsentStatus,
} from './upload-consent-storage';

interface UploadConsentContextValue {
  /** 동의 다이얼로그를 지금 띄워야 하는가 — 스플래시 해제 + 업데이트 판정 완료 후에만 참. */
  promptVisible: boolean;
  /** 이번 세션에 동의 팝업이 더는 뜰 일이 없는가. 후순위 팝업(피드백)이 이걸 기다린다. */
  settled: boolean;
  /** 사용자가 고른 값을 기록하고 팝업을 닫는다. */
  decide: (status: Exclude<UploadConsentStatus, 'unknown'>) => void;
  /** 인앱 스플래시가 사라진 순간 `AppSplashGate` 가 1회 호출한다. */
  markSplashDone: () => void;
}

const UploadConsentContext = createContext<UploadConsentContextValue | null>(null);

/**
 * 오디오 수집 동의 팝업 상태를 소유하는 Provider. 팝업 우선순위(업데이트 → 동의 → 피드백)를
 * 지키기 위해 스플래시 해제 신호와 업데이트 판정(`AppUpdateProvider`)을 표출 게이트로 삼고,
 * 다음 차례인 `FeedbackProvider` 는 `settled` 를 구독해 기다린다.
 */
export function UploadConsentProvider({ children }: { children: ReactNode }) {
  const { checked, prompt } = useAppUpdateContext();

  // loaded 는 필수 — 없으면 settled 가 기록을 읽기 전에 참이 되어 피드백이 성급히 뜬다.
  const [loaded, setLoaded] = useState(false);
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const record = await loadUploadConsent();
      if (!cancelled) {
        setShouldPrompt(shouldShowUploadConsentNotice(record));
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const decide = useCallback((status: Exclude<UploadConsentStatus, 'unknown'>) => {
    setShouldPrompt(false);
    saveUploadConsentDecision(status, UPLOAD_CONSENT_NOTICE_VERSION).catch((error: unknown) => {
      reportError(error, { scope: 'upload-consent.saveDecision' });
    });
  }, []);

  const markSplashDone = useCallback(() => setSplashDone(true), []);

  const value = useMemo<UploadConsentContextValue>(
    () => ({
      promptVisible: splashDone && checked && prompt === null && shouldPrompt,
      settled: loaded && !shouldPrompt,
      decide,
      markSplashDone,
    }),
    [splashDone, checked, prompt, shouldPrompt, loaded, decide, markSplashDone]
  );

  return <UploadConsentContext.Provider value={value}>{children}</UploadConsentContext.Provider>;
}

export function useUploadConsent(): UploadConsentContextValue {
  const value = use(UploadConsentContext);
  if (!value) {
    throw new Error('useUploadConsent must be used within UploadConsentProvider');
  }
  return value;
}
