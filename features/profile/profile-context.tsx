import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useOptionalAnalytics } from '@/features/analytics/analytics-context';
import { diffDaysIso } from '@/features/shared/date-utils';

import type { ParrotProfile } from './profile-types';
import { loadStoredProfile, saveStoredProfile } from './profile-storage';

interface ProfileContextValue {
  profile: ParrotProfile | null;
  isHydrated: boolean;
  errorMessage: string | null;
  saveProfile: (profile: ParrotProfile) => Promise<void>;
  updateProfile: (nextProfile: ParrotProfile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  // analytics seam은 optional로 구독한다. AnalyticsProvider가 바깥에 있으면(정상 순서)
  // 아래 effect가 준비 시점에 user property를 동기화하고, 없으면 동기화를 건너뛴다 —
  // 마운트 순서에 대한 하드 크래시 결합 대신 effect 게이팅으로 완화한다.
  const analytics = useOptionalAnalytics();
  const analyticsReady = analytics?.isReady ?? false;
  const setUserProperty = analytics?.setUserProperty ?? null;

  const [profile, setProfile] = useState<ParrotProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAnalytics = analytics !== null;

  useEffect(() => {
    // 순서 계약 위반(AnalyticsProvider가 바깥에 없음)을 조용히 묻지 않고 dev에서 표면화한다.
    if (hasAnalytics || !__DEV__) return;
    console.warn(
      '[profile] AnalyticsProvider가 ProfileProvider 바깥에 없어 user property 동기화를 건너뜁니다 — AppProviders의 provider 순서를 확인하세요.'
    );
  }, [hasAnalytics]);

  useEffect(() => {
    if (!analyticsReady || !setUserProperty) return;

    // null 가드 후 non-null로 좁혀진 참조를 로컬에 고정한다 — 중첩 async 클로저에서는
    // TS가 외부 const의 narrowing을 유지하지 않기 때문이다.
    const syncUserProperty = setUserProperty;

    async function syncUserProperties(): Promise<void> {
      if (profile) {
        await Promise.all([
          syncUserProperty('parrot_name', profile.name),
          syncUserProperty('parrot_species', profile.species),
          syncUserProperty('parrot_age_months', profile.ageMonths),
          syncUserProperty('profile_age_days', diffDaysIso(profile.createdAt)),
        ]);
        return;
      }

      await Promise.all([
        syncUserProperty('parrot_name', null),
        syncUserProperty('parrot_species', null),
        syncUserProperty('parrot_age_months', null),
        syncUserProperty('profile_age_days', null),
      ]);
    }

    void syncUserProperties();
  }, [analyticsReady, profile, setUserProperty]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateProfile(): Promise<void> {
      try {
        const storedProfile = await loadStoredProfile();

        if (isMounted) {
          setProfile(storedProfile);
          setErrorMessage(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setProfile(null);
          setErrorMessage(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = useCallback(async (nextProfile: ParrotProfile): Promise<void> => {
    await saveStoredProfile(nextProfile);
    setProfile({ ...nextProfile });
    setErrorMessage(null);
  }, []);

  const updateProfile = useCallback(
    async (nextProfile: ParrotProfile): Promise<void> => {
      await saveProfile({
        ...nextProfile,
        updatedAt: new Date().toISOString(),
      });
    },
    [saveProfile]
  );

  const value = useMemo(
    () => ({
      profile,
      isHydrated,
      errorMessage,
      saveProfile,
      updateProfile,
    }),
    [errorMessage, isHydrated, profile, saveProfile, updateProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = use(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
}
