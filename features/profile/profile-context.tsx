import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAnalytics } from '@/features/analytics/analytics-context';
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
  const { isReady: analyticsReady, installationId, setUserId, setUserProperty } = useAnalytics();

  const [profile, setProfile] = useState<ParrotProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!analyticsReady) return;

    async function syncIdentity(): Promise<void> {
      if (profile) {
        await setUserId(profile.id);
        await Promise.all([
          setUserProperty('parrot_name', profile.name),
          setUserProperty('parrot_species', profile.species),
          setUserProperty('parrot_age_months', profile.ageMonths),
          setUserProperty('profile_age_days', diffDaysIso(profile.createdAt)),
        ]);
        return;
      }

      await setUserId(installationId);
      await Promise.all([
        setUserProperty('parrot_name', null),
        setUserProperty('parrot_species', null),
        setUserProperty('parrot_age_months', null),
        setUserProperty('profile_age_days', null),
      ]);
    }

    void syncIdentity();
  }, [analyticsReady, installationId, profile, setUserId, setUserProperty]);

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
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }

  return context;
}
