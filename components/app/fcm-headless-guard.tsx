import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { getFcmHeadlessLaunchStatus } from '@/features/notifications/fcm-client';

export function FcmHeadlessGuard({ children }: { children: ReactNode }) {
  const [isHeadless, setIsHeadless] = useState<boolean | null>(
    Platform.OS === 'ios' ? null : false
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return undefined;
    }

    let isMounted = true;

    async function checkHeadlessLaunch(): Promise<void> {
      try {
        const nextIsHeadless = await getFcmHeadlessLaunchStatus();
        if (isMounted) {
          setIsHeadless(nextIsHeadless);
        }
      } catch (error: unknown) {
        console.warn('[notifications.headlessCheck]', error);
        if (isMounted) {
          setIsHeadless(false);
        }
      }
    }

    void checkHeadlessLaunch();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isHeadless !== false) {
    return null;
  }

  return children;
}
