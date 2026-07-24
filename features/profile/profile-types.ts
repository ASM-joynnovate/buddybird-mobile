export interface ParrotProfile {
  id: string;
  name: string;
  species: string;
  birthDate: string | null; // YYYY-MM-DD, null = 생년월일 모름
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDraft {
  name: string;
  species: string;
  birthDate: string | null; // YYYY-MM-DD, null = 생년월일 모름
  photoUri?: string;
}

export interface ProfileValidationErrors {
  name?: string;
  species?: string;
  birthDate?: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationErrors;
}
