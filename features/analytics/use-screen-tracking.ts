import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAnalytics } from './analytics-context';

export function useScreenTracking(screenName: string, screenClass?: string): void {
  const { setScreen } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      setScreen(screenName, screenClass);
    }, [screenName, screenClass, setScreen])
  );
}
