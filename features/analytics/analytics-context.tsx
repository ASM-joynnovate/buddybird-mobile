import Constants from 'expo-constants';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { diffDaysIso } from '@/features/shared/date-utils';

import { reportProviderFailure } from './analytics-utils';
import { createFanoutAnalyticsClient, type AnalyticsClient } from './client';
import { registerErrorReporter } from './error-reporter';
import { consentAllowsCollection, ensureTrackingConsent, type ConsentState } from './consent';
import { installGlobalErrorReporting } from './error-reporting';
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

interface AnalyticsContextValue {
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
  const clientRef = useRef<AnalyticsClient>(
    createFanoutAnalyticsClient({
      providers: buildProviders(),
      onProviderFailure: reportProviderFailure,
    })
  );

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
      await client.init();

      const resolvedConsent = await ensureTrackingConsent();
      await client.setEnabled(consentAllowsCollection(resolvedConsent));

      const id = await getOrCreateInstallationId();
      await client.setUserId(id);

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

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used inside AnalyticsProvider');
  }

  return context;
}
