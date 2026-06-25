import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

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
    ageMonths: value.ageMonths,
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
  ageMonths: number;
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
    typeof profile.ageMonths === 'number' &&
    typeof profile.createdAt === 'string' &&
    typeof profile.updatedAt === 'string' &&
    (profile.photoUri === undefined || typeof profile.photoUri === 'string') &&
    (profile.customSpecies === undefined || typeof profile.customSpecies === 'string')
  );
}

function normalizeStoredSpecies(species: string, customSpecies: string | undefined): string {
  if (species === 'custom') {
    return customSpecies?.trim() || species;
  }
  return species;
}

export async function saveStoredProfile(profile: ParrotProfile): Promise<void> {
  await profileStore.save(profile);
}
