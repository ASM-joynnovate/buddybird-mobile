import { useCallback, useEffect, useRef, useState } from 'react';

import { reportError } from '@/features/analytics/error-reporter';

import { shouldShowUploadConsentNotice } from '../upload-consent-decision';
import { UPLOAD_CONSENT_NOTICE_VERSION } from '../upload-consent-notice';
import {
  loadUploadConsent,
  saveUploadConsentDecision,
  type UploadConsentStatus,
} from '../upload-consent-storage';

export interface UseUploadConsentResult {
  /** 팝업을 띄워야 하는지. 기록을 읽기 전에는 `false`. */
  shouldPrompt: boolean;
  /** 사용자가 고른 값을 기록하고 팝업을 닫는다. */
  decide: (status: Exclude<UploadConsentStatus, 'unknown'>) => void;
}

export function useUploadConsent(): UseUploadConsentResult {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    void (async () => {
      const record = await loadUploadConsent();
      if (isMountedRef.current) {
        setShouldPrompt(shouldShowUploadConsentNotice(record));
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const decide = useCallback((status: Exclude<UploadConsentStatus, 'unknown'>) => {
    setShouldPrompt(false);
    saveUploadConsentDecision(status, UPLOAD_CONSENT_NOTICE_VERSION).catch((error: unknown) => {
      reportError(error, { scope: 'upload-consent.saveDecision' });
    });
  }, []);

  return { shouldPrompt, decide };
}
