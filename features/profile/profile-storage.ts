import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ParrotProfile, SpeciesId, TrainingGoalId } from './profile-types';

export const PROFILE_STORAGE_KEY = '@pethub/parrot-profile';

export class ProfileStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileStorageError';
  }
}

export async function loadStoredProfile(): Promise<ParrotProfile | null> {
  const rawProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

  if (!rawProfile) {
    return null;
  }

  try {
    return parseStoredProfile(JSON.parse(rawProfile));
  } catch {
    throw new ProfileStorageError('저장된 프로필을 읽을 수 없습니다.');
  }
}

function parseStoredProfile(value: unknown): ParrotProfile {
  if (!isStoredProfile(value)) {
    throw new ProfileStorageError('저장된 프로필 형식이 올바르지 않습니다.');
  }

  const normalizedSpecies = normalizeStoredSpecies(value.species, value.customSpecies);

  return {
    ...value,
    customSpecies: normalizedSpecies.customSpecies,
    species: normalizedSpecies.species,
    trainingGoalIds: [...value.trainingGoalIds],
  };
}

function isStoredProfile(value: unknown): value is ParrotProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Partial<ParrotProfile>;

  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.species === 'string' &&
    typeof profile.ageMonths === 'number' &&
    Array.isArray(profile.trainingGoalIds) &&
    profile.trainingGoalIds.every(isTrainingGoalId) &&
    typeof profile.createdAt === 'string' &&
    typeof profile.updatedAt === 'string' &&
    (profile.photoUri === undefined || typeof profile.photoUri === 'string')
  );
}

function normalizeStoredSpecies(
  species: string,
  customSpecies: string | undefined
): Pick<ParrotProfile, 'customSpecies' | 'species'> {
  if (isSpeciesId(species) || species === 'custom') {
    return { customSpecies, species };
  }

  const migratedSpecies = legacySpeciesLabelToId[species];
  return migratedSpecies ? { customSpecies: undefined, species: migratedSpecies } : { customSpecies: species, species: 'custom' };
}

function isSpeciesId(value: string): value is SpeciesId {
  return value === 'african-grey' || value === 'cockatoo' || value === 'budgie' || value === 'parakeet' || value === 'lovebird' || value === 'conure';
}

function isTrainingGoalId(value: unknown): value is TrainingGoalId {
  return value === 'greet' || value === 'fruit' || value === 'name' || value === 'leave' || value === 'song';
}

const legacySpeciesLabelToId: Record<string, SpeciesId> = {
  'African Grey': 'african-grey',
  Budgie: 'budgie',
  Cockatoo: 'cockatoo',
  Conure: 'conure',
  Lovebird: 'lovebird',
  Parakeet: 'parakeet',
  사랑앵무: 'budgie',
  잉꼬: 'parakeet',
  코뉴어: 'conure',
  코카투: 'cockatoo',
  모란앵무: 'lovebird',
  회색앵무: 'african-grey',
};

export async function saveStoredProfile(profile: ParrotProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
