import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

import { useAnalytics } from '../analytics-context';

export interface ScreenTracking {
  elapsedMs: () => number;
}

export function useScreenTracking(screenName: string, screenClass?: string): ScreenTracking {
  const { setScreen } = useAnalytics();
  const enteredAtRef = useRef(Date.now());

  useFocusEffect(
    useCallback(() => {
      enteredAtRef.current = Date.now();
      setScreen(screenName, screenClass);
    }, [screenName, screenClass, setScreen])
  );

  const elapsedMs = useCallback(() => Date.now() - enteredAtRef.current, []);

  return { elapsedMs };
}
