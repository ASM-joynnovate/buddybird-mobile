export interface ParrotProfile {
  id: string;
  name: string;
  species: string;
  ageMonths: number;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDraft {
  name: string;
  species: string;
  ageMonths: number;
  photoUri?: string;
}

export interface ProfileValidationErrors {
  name?: string;
  species?: string;
  ageMonths?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationErrors;
}
