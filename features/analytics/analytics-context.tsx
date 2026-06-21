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

import { diffDaysIso } from '@/features/shared/date-utils';

import { reportProviderFailure } from './analytics-utils';
import { createFanoutAnalyticsClient, type AnalyticsClient } from './client';
import { installGlobalErrorReporting, registerErrorReporter } from './error-reporter';
import { consentAllowsCollection, ensureTrackingConsent, type ConsentState } from './consent';
import type { AnalyticsEvent, UserPropertyKey } from './events';
import { getOrCreateInstallationId } from './identity';
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
  installationId: string | null;
  track: <E extends AnalyticsEvent>(event: E) => void;
  setUserId: (id: string | null) => Promise<void>;
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
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let uninstallErrorReporting: (() => void) | null = null;
    const unregisterReporter = registerErrorReporter(clientRef.current);

    async function bootstrap(): Promise<void> {
      const client = clientRef.current;
      // init()이 먼저 끝나야 setEnabled/setUserId를 호출할 수 있다.
      await client.init();

      // 동의 조회와 설치 ID 발급은 서로 독립적이라 동시에 실행한다.
      const [resolvedConsent, id] = await Promise.all([
        ensureTrackingConsent(),
        getOrCreateInstallationId(),
      ]);
      // setEnabled/setUserId도 서로 독립적(둘 다 init 이후에만 가능)이라 함께 실행한다.
      await Promise.all([
        client.setEnabled(consentAllowsCollection(resolvedConsent)),
        client.setUserId(id),
      ]);

      uninstallErrorReporting = installGlobalErrorReporting({
        client,
        getCurrentScreen: () => currentScreenRef.current,
      });

      if (isMounted) {
        setConsent(resolvedConsent);
        setInstallationId(id);
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

  const track = useCallback(<E extends AnalyticsEvent>(event: E): void => {
    void clientRef.current.logEvent(event);
  }, []);

  const setUserId = useCallback(async (id: string | null): Promise<void> => {
    await clientRef.current.setUserId(id);
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
      installationId,
      currentScreen,
      track,
      setUserId,
      setUserProperty,
      setScreen,
      flushSessionWordMetrics,
      recordError,
    }),
    [
      isReady,
      consent,
      installationId,
      currentScreen,
      track,
      setUserId,
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
