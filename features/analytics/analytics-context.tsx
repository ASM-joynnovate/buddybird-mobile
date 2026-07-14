import Constants from 'expo-constants';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

import { getCurrentUid } from '@/features/auth/auth-identity';
import { useOptionalAuth } from '@/features/auth/auth-context';
import { diffDaysIso } from '@/features/shared/date-utils';

import { reportProviderFailure } from './analytics-utils';
import { createFanoutAnalyticsClient, type AnalyticsClient } from './client';
import { installGlobalErrorReporting, registerErrorReporter } from './error-reporter';
import { consentAllowsCollection, ensureTrackingConsent, type ConsentState } from './consent';
import type { AnalyticsEvent, UserPropertyKey } from './events';
import { ClarityProvider } from './providers/clarity-provider';
import { FirebaseProvider } from './providers/firebase-provider';
import { NoopProvider } from './providers/noop-provider';
import type { AnalyticsProviderAdapter } from './providers/types';
import {
  applySessionDeltas,
  type WordLifetimeMetrics,
  type WordSessionDelta,
} from './word-metrics-storage';

export interface AnalyticsContextValue {
  isReady: boolean;
  consent: ConsentState;
  track: <E extends AnalyticsEvent>(event: E) => void;
  setUserProperty: (key: UserPropertyKey, value: string | number | null) => Promise<void>;
  setScreen: (name: string, screenClass?: string) => void;
  flushSessionWordMetrics: (deltas: readonly WordSessionDelta[]) => Promise<readonly WordLifetimeMetrics[]>;
  recordError: (error: Error, context?: Record<string, string>) => Promise<void>;
  currentScreen: string | null;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function resolveClarityProjectId(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.clarityProjectId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return fromExtra;
  }

  const envValue = process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID;
  if (typeof envValue === 'string' && envValue.length > 0) {
    return envValue;
  }

  return null;
}

function buildProviders(): AnalyticsProviderAdapter[] {
  const providers: AnalyticsProviderAdapter[] = [];

  if (Platform.OS === 'web') {
    providers.push(new NoopProvider());
    return providers;
  }

  providers.push(new FirebaseProvider());

  const clarityProjectId = resolveClarityProjectId();
  if (clarityProjectId) {
    providers.push(new ClarityProvider({ projectId: clarityProjectId }));
  }

  if (providers.length === 0) {
    providers.push(new NoopProvider());
  }

  return providers;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const auth = useOptionalAuth();
  const uid = auth?.uid ?? null;
  const authIsInitializing = auth?.isInitializing ?? false;
  const hasAuth = auth !== null;

  // 무거운 fanout 클라이언트(프로바이더 인스턴스 생성 포함)는 첫 렌더에서 한 번만 만든다.
  const clientRef = useRef<AnalyticsClient>(null!);
  if (clientRef.current === null) {
    clientRef.current = createFanoutAnalyticsClient({
      providers: buildProviders(),
      onProviderFailure: reportProviderFailure,
    });
  }

  const currentScreenRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState>('unknown');
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  useEffect(() => {
    if (hasAuth || !__DEV__) return;
    console.warn(
      '[analytics] AuthProvider가 AnalyticsProvider 바깥에 없어 user id 동기화를 건너뜁니다 — AppProviders의 provider 순서를 확인하세요.'
    );
  }, [hasAuth]);

  useEffect(() => {
    let isMounted = true;
    let uninstallErrorReporting: (() => void) | null = null;
    const unregisterReporter = registerErrorReporter(clientRef.current);

    async function bootstrap(): Promise<void> {
      const client = clientRef.current;
      // init()이 먼저 끝나야 setEnabled/setUserId를 호출할 수 있다.
      await client.init();

      const resolvedConsent = await ensureTrackingConsent();
      const restoredUid = Platform.OS === 'web' ? null : getCurrentUid();

      // 이미 복원된 uid는 첫 app_open보다 먼저 적용한다. uid가 아직 없으면 기다리지 않고
      // 익명 수집을 시작하고, 이후 auth 구독 effect가 확보 시점에 적용한다.
      await Promise.all([
        client.setEnabled(consentAllowsCollection(resolvedConsent)),
        client.setUserId(restoredUid),
      ]);

      uninstallErrorReporting = installGlobalErrorReporting({
        client,
        getCurrentScreen: () => currentScreenRef.current,
      });

      if (isMounted) {
        setConsent(resolvedConsent);
        setIsReady(true);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
      uninstallErrorReporting?.();
      unregisterReporter();
    };
  }, []);

  useEffect(() => {
    if (!isReady || authIsInitializing) return;

    void clientRef.current.setUserId(uid);
  }, [authIsInitializing, isReady, uid]);

  const track = useCallback(<E extends AnalyticsEvent>(event: E): void => {
    void clientRef.current.logEvent(event);
  }, []);

  const setUserProperty = useCallback(
    async (key: UserPropertyKey, value: string | number | null): Promise<void> => {
      const stringValue = value === null ? null : String(value);
      await clientRef.current.setUserProperty(key, stringValue);
    },
    []
  );

  const setScreen = useCallback((name: string, screenClass?: string): void => {
    currentScreenRef.current = name;
    setCurrentScreen(name);
    void clientRef.current.setScreen(name, screenClass);
  }, []);

  const flushSessionWordMetrics = useCallback(
    async (deltas: readonly WordSessionDelta[]): Promise<readonly WordLifetimeMetrics[]> => {
      const updated = await applySessionDeltas(deltas);
      const client = clientRef.current;

      for (const metric of updated) {
        await client.logEvent({
          name: 'word_lifetime_metrics',
          params: {
            word_id: metric.word_id,
            word_name: metric.word_name,
            lifetime_practice_count: metric.lifetime_practice_count,
            lifetime_practice_duration_ms: metric.lifetime_practice_duration_ms,
            lifetime_recording_count: metric.lifetime_recording_count,
            last_practiced_at_days_ago: diffDaysIso(metric.last_practiced_at_iso),
          },
        });
      }

      return updated;
    },
    []
  );

  const recordError = useCallback(
    async (error: Error, context?: Record<string, string>): Promise<void> => {
      await clientRef.current.recordError(error, context);
    },
    []
  );

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      isReady,
      consent,
      currentScreen,
      track,
      setUserProperty,
      setScreen,
      flushSessionWordMetrics,
      recordError,
    }),
    [
      isReady,
      consent,
      currentScreen,
      track,
      setUserProperty,
      setScreen,
      flushSessionWordMetrics,
      recordError,
    ]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/**
 * AnalyticsProvider 바깥에서도 throw 없이 구독한다(없으면 null). provider 마운트
 * 순서에 하드 결합되면 안 되는 소비처(예: `ProfileProvider`)가 effect 게이팅으로
 * analytics 준비를 기다릴 수 있게 한다.
 */
export function useOptionalAnalytics(): AnalyticsContextValue | null {
  return use(AnalyticsContext);
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useOptionalAnalytics();

  if (!context) {
    throw new Error('useAnalytics must be used inside AnalyticsProvider');
  }

  return context;
}
