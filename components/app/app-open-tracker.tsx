import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';

export function AppOpenTracker() {
  const { track } = useAnalytics();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const openedRef = useRef(false);
  const foregroundedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      track({ name: 'app_open', params: { cold_start: true } });
    }
    foregroundedAtRef.current = Date.now();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState.match(/inactive|background/) && nextState === 'active') {
        foregroundedAtRef.current = Date.now();
        track({ name: 'app_foreground', params: {} });
        return;
      }

      if (prevState === 'active' && nextState.match(/inactive|background/)) {
        const sessionDurationMs = Date.now() - foregroundedAtRef.current;
        track({
          name: 'app_background',
          params: { session_duration_ms: sessionDurationMs },
        });
      }
    });

    return () => subscription.remove();
  }, [track]);

  return null;
}
