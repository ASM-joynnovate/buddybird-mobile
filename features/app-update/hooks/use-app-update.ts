import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { useI18n } from '@/features/i18n/i18n-context';

import { APP_UPDATE_MIN_FETCH_INTERVAL_MS, fetchRemoteVersionInfo } from '../app-update-config';
import { decideUpdate } from '../app-update-decision';
import { openStorePage } from '../app-update-store';
import {
  loadAppUpdateState,
  saveDismissedVersion,
  saveLastCheckedAt,
} from '../app-update-storage';
import type { UpdatePrompt } from '../app-update-types';

export interface UseAppUpdateResult {
  /** 표시할 프롬프트. 없으면 `null`. */
  prompt: UpdatePrompt | null;
  /** 소프트 프롬프트 '취소' — 이 버전을 거부 기록하고 닫는다. 강제 프롬프트에선 무시. */
  dismiss: () => void;
  /** '업데이트' — 스토어를 열고 수락 이벤트를 기록한다. 소프트는 닫고, 강제는 유지한다. */
  openStore: () => void;
}

/**
 * 콜드 시작 + 포그라운드 복귀(6h 간격 게이트) 시 Remote Config 를 조회해 업데이트 프롬프트를
 * 판정한다. 실제 팝업 렌더링은 소비 컴포넌트(`AppUpdateGate`)가 담당한다.
 */
export function useAppUpdate(): UseAppUpdateResult {
  const { isReady, track } = useAnalytics();
  const { locale } = useI18n();

  const [prompt, setPrompt] = useState<UpdatePrompt | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isMountedRef = useRef(true);
  const shownVersionRef = useRef<string | null>(null);

  const runCheck = useCallback(
    async (options: { respectInterval: boolean }): Promise<void> => {
      const currentVersion = getCurrentVersion();
      if (!currentVersion) return;

      const state = await loadAppUpdateState();

      if (
        options.respectInterval &&
        state.lastCheckedAt !== null &&
        Date.now() - state.lastCheckedAt < APP_UPDATE_MIN_FETCH_INTERVAL_MS
      ) {
        return;
      }

      const info = await fetchRemoteVersionInfo();
      // fetch 를 시도했으면(성공·실패 무관) 포그라운드 재조회를 6h 로 throttle 한다.
      await saveLastCheckedAt(Date.now());
      if (!info || !isMountedRef.current) return;

      const decision = decideUpdate({
        currentVersion,
        info,
        dismissedVersion: state.dismissedVersion,
        locale,
      });
      if (isMountedRef.current) {
        setPrompt(decision);
      }
    },
    [locale]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    void runCheck({ respectInterval: false });

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState.match(/inactive|background/) && nextState === 'active') {
        void runCheck({ respectInterval: true });
      }
    });

    return () => subscription.remove();
  }, [isReady, runCheck]);

  // 프롬프트가 표시되는 순간(버전당 1회) shown 이벤트를 기록한다.
  useEffect(() => {
    if (prompt && shownVersionRef.current !== prompt.latestVersion) {
      shownVersionRef.current = prompt.latestVersion;
      track({
        name: 'update_prompt_shown',
        params: { latest_version: prompt.latestVersion, is_forced: prompt.kind === 'forced' },
      });
    } else if (!prompt) {
      shownVersionRef.current = null;
    }
  }, [prompt, track]);

  const dismiss = useCallback(() => {
    if (!prompt || prompt.kind === 'forced') return;
    track({
      name: 'update_prompt_dismissed',
      params: { latest_version: prompt.latestVersion },
    });
    void saveDismissedVersion(prompt.latestVersion);
    setPrompt(null);
  }, [prompt, track]);

  const openStore = useCallback(() => {
    if (!prompt) return;
    track({
      name: 'update_prompt_accepted',
      params: { latest_version: prompt.latestVersion, is_forced: prompt.kind === 'forced' },
    });
    void openStorePage();
    // 소프트는 스토어로 이동하며 닫고, 강제는 업데이트가 끝날 때까지 유지한다.
    if (prompt.kind !== 'forced') {
      setPrompt(null);
    }
  }, [prompt, track]);

  return { prompt, dismiss, openStore };
}

function getCurrentVersion(): string | null {
  if (Application.nativeApplicationVersion) {
    return Application.nativeApplicationVersion;
  }
  const configVersion = Constants.expoConfig?.version;
  return typeof configVersion === 'string' ? configVersion : null;
}
