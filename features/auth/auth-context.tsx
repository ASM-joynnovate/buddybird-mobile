import { createContext, use, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { reportError } from '@/features/analytics/error-reporter';

import { ensureAnonymousUser, getCurrentUid, subscribeToUid } from './auth-identity';

export interface AuthContextValue {
  uid: string | null;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  return typeof error.code === 'string' ? error.code : null;
}

function handleAnonymousSignInError(error: unknown): void {
  if (getAuthErrorCode(error) === 'auth/network-request-failed') {
    console.warn('[auth]', error);
    return;
  }

  reportError(error, { scope: 'auth.ensureAnonymousUser' });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [uid, setUid] = useState<string | null>(() =>
    Platform.OS === 'web' ? null : getCurrentUid()
  );
  const [isInitializing, setIsInitializing] = useState(Platform.OS !== 'web');
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;
    const unsubscribe = subscribeToUid(setUid);

    async function initialize(): Promise<void> {
      try {
        await ensureAnonymousUser();
        if (isMounted) {
          setUid(getCurrentUid());
        }
      } catch (error: unknown) {
        handleAnonymousSignInError(error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    void initialize();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (!prevState.match(/inactive|background/) || nextState !== 'active' || getCurrentUid()) {
        return;
      }

      void ensureAnonymousUser().catch(handleAnonymousSignInError);
    });

    return () => {
      isMounted = false;
      unsubscribe();
      subscription.remove();
    };
  }, []);

  // 후속 계정 연동은 이 provider가 linkWithCredential 전이를 소유한다.
  const value = useMemo(() => ({ uid, isInitializing }), [isInitializing, uid]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useOptionalAuth(): AuthContextValue | null {
  return use(AuthContext);
}

export function useAuth(): AuthContextValue {
  const context = useOptionalAuth();

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
