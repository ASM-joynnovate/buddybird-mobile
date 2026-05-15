import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ParrotProfile, TrainingGoalId } from './profile-types';

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
  } catch (error: unknown) {
    console.warn('[profile] failed to parse stored profile:', error);
    throw new ProfileStorageError('저장된 프로필을 읽을 수 없습니다.');
  }
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
    trainingGoalIds: [...value.trainingGoalIds],
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
  trainingGoalIds: TrainingGoalId[];
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
    Array.isArray(profile.trainingGoalIds) &&
    profile.trainingGoalIds.every(isTrainingGoalId) &&
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

function isTrainingGoalId(value: unknown): value is TrainingGoalId {
  return value === 'greet' || value === 'fruit' || value === 'name' || value === 'leave' || value === 'song';
}

export async function saveStoredProfile(profile: ParrotProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
