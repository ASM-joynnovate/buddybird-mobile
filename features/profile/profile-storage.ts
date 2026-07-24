import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import { birthDateFromAgeMonths } from './profile-age';
import type { ParrotProfile } from './profile-types';

export const PROFILE_STORAGE_KEY = '@buddybird/parrot-profile';

export class ProfileStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileStorageError';
  }
}

const profileStore = persistKeyedStore<ParrotProfile | null>({
  key: PROFILE_STORAGE_KEY,
  scope: 'profile.loadStored',
  parse: parseStoredProfile,
  // 미저장(키 없음) 시에만 null 을 반환한다.
  fallback: () => null,
  // 손상/검증 실패는 fallback 하지 않고 표면화한다.
  // seam 이 이미 reportError(scope) 를 호출했으므로 여기서는 일반 메시지로 throw 만 한다.
  // parse 가 던지는 구체 메시지·JSON.parse SyntaxError 모두 이 일반 메시지로 치환된다.
  recover: () => {
    throw new ProfileStorageError('저장된 프로필을 읽을 수 없습니다.');
  },
});

export async function loadStoredProfile(): Promise<ParrotProfile | null> {
  return profileStore.load();
}

function parseStoredProfile(value: unknown): ParrotProfile {
  if (!isStoredProfile(value)) {
    throw new ProfileStorageError('저장된 프로필 형식이 올바르지 않습니다.');
  }

  return {
    id: value.id,
    name: value.name,
    species: normalizeStoredSpecies(value.species, value.customSpecies),
    birthDate: normalizeStoredBirthDate(value),
    photoUri: value.photoUri,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

interface StoredProfileShape {
  id: string;
  name: string;
  species: string;
  customSpecies?: string;
  // string = 생년월일, null = 모름(명시적). 미보유(undefined)는 레거시.
  birthDate?: string | null;
  // 레거시(생년월일 도입 전) 프로필은 birthDate 없이 ageMonths 스냅샷만 보유한다.
  ageMonths?: number;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

function isStoredProfile(value: unknown): value is StoredProfileShape {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Partial<StoredProfileShape>;

  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.species === 'string' &&
    typeof profile.createdAt === 'string' &&
    typeof profile.updatedAt === 'string' &&
    // birthDate(신규: string 또는 명시적 null=모름) 또는 ageMonths(레거시) 중 하나는 있어야 한다.
    (typeof profile.birthDate === 'string' ||
      profile.birthDate === null ||
      typeof profile.ageMonths === 'number') &&
    (profile.photoUri === undefined || typeof profile.photoUri === 'string') &&
    (profile.customSpecies === undefined || typeof profile.customSpecies === 'string')
  );
}

// birthDate가 저장돼 있으면(string=생일, null=모름) 그대로, 미보유(레거시)면 ageMonths를 역산 back-fill 한다.
function normalizeStoredBirthDate(value: StoredProfileShape): string | null {
  if (value.birthDate !== undefined) {
    return value.birthDate;
  }
  return birthDateFromAgeMonths(value.createdAt, value.ageMonths as number);
}

function normalizeStoredSpecies(species: string, customSpecies: string | undefined): string {
  if (species === 'custom') {
    return customSpecies?.trim() || species;
  }
  // 레거시 통합: '잉꼬'(parakeet)와 '사랑앵무'(budgie)는 같은 종이라 budgie로 정규화한다.
  if (species === 'parakeet') {
    return 'budgie';
  }
  return species;
}

export async function saveStoredProfile(profile: ParrotProfile): Promise<void> {
  await profileStore.save(profile);
}
