import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useOptionalAnalytics, type UserProperties } from '@/features/analytics/analytics-context';
import { diffDaysIso } from '@/features/shared/date-utils';

import { ageMonthsFromBirthDate } from './profile-age';
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

// profile_updated의 fields_changed 대상 — 사용자가 편집 가능한 필드만 (updatedAt 등 메타 제외).
const PROFILE_UPDATE_TRACKED_FIELDS = ['name', 'species', 'birthDate', 'photoUri'] as const;

export function ProfileProvider({ children }: PropsWithChildren) {
  // analytics seam은 optional로 구독한다. AnalyticsProvider가 바깥에 있으면(정상 순서)
  // 복원 완료 시 초기 속성을 전달하고 저장 성공 시 변경을 등록한다.
  const analytics = useOptionalAnalytics();
  const initializeUserProperties = analytics?.initializeUserProperties;
  const setUserProperties = analytics?.setUserProperties;
  const track = analytics?.track ?? null;

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
    if (!isHydrated) return;
    initializeUserProperties?.(profileProperties(profile));
  }, [initializeUserProperties, isHydrated, profile]);

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
    // 전송 완료는 기다리지 않지만 후속 이벤트보다 먼저 속성 변경을 등록한다.
    setUserProperties?.(profileProperties(nextProfile));
    setProfile({ ...nextProfile });
    setErrorMessage(null);
  }, [setUserProperties]);

  const updateProfile = useCallback(
    async (nextProfile: ParrotProfile): Promise<void> => {
      const previousProfile = profile;

      await saveProfile({
        ...nextProfile,
        updatedAt: new Date().toISOString(),
      });

      // 저장 성공 후에만 발화. 변경 필드가 없으면(동일 내용 저장) 노이즈 방지를 위해 생략.
      if (!track || !previousProfile) return;

      const fieldsChanged = PROFILE_UPDATE_TRACKED_FIELDS.filter(
        (field) => previousProfile[field] !== nextProfile[field]
      );

      if (fieldsChanged.length === 0) return;

      track({
        name: 'profile_updated',
        params: {
          fields_changed: fieldsChanged,
          ...(fieldsChanged.includes('name') ? { parrot_name: nextProfile.name } : {}),
          ...(fieldsChanged.includes('species') ? { parrot_species: nextProfile.species } : {}),
          ...(fieldsChanged.includes('birthDate')
            ? { parrot_age_months: ageMonthsFromBirthDate(nextProfile.birthDate) ?? undefined }
            : {}),
        },
      });
    },
    [profile, saveProfile, track]
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

function profileProperties(profile: ParrotProfile | null): UserProperties {
  return {
    parrot_name: profile?.name ?? null,
    parrot_species: profile?.species ?? null,
    parrot_age_months: profile ? ageMonthsFromBirthDate(profile.birthDate) : null,
    profile_age_days: profile ? diffDaysIso(profile.createdAt) : null,
  };
}
