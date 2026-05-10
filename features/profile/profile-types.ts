import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type TrainingGoalId = 'greet' | 'fruit' | 'name' | 'leave' | 'song';
export type SpeciesId = 'african-grey' | 'cockatoo' | 'budgie' | 'parakeet' | 'lovebird' | 'conure';

export interface ParrotProfile {
  id: string;
  name: string;
  species: SpeciesId | 'custom';
  customSpecies?: string;
  ageMonths: number;
  photoUri?: string;
  trainingGoalIds: TrainingGoalId[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDraft {
  name: string;
  species: SpeciesId | 'custom' | '';
  customSpecies?: string;
  ageMonths: number;
  photoUri?: string;
  trainingGoalIds: TrainingGoalId[];
}

export interface ProfileValidationErrors {
  name?: string;
  species?: string;
  ageMonths?: string;
  trainingGoalIds?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationErrors;
}

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface TrainingGoal {
  id: TrainingGoalId;
  label: string;
  sample: string;
  icon: MaterialIconName;
}
