import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ensureFcmRegistration, subscribeToFcmMessages } from '../fcm-client';
import type { FcmRegistration } from '../fcm-types';

interface UseFcmRegistrationOptions {
  enabled: boolean;
}

export function useFcmRegistration({ enabled }: UseFcmRegistrationOptions): FcmRegistration | null {
  const [registration, setRegistration] = useState<FcmRegistration | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setRegistration(null);
      return undefined;
    }

    if (!enabled) {
      setRegistration(null);
      return undefined;
    }

    let isMounted = true;
    const unsubscribe = subscribeToFcmMessages();

    async function bootstrap(): Promise<void> {
      try {
        const nextRegistration = await ensureFcmRegistration();
        if (isMounted) {
          setRegistration(nextRegistration);
        }
      } catch (error: unknown) {
        console.warn('[notifications.bootstrap]', error);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [enabled]);

  return registration;
}
