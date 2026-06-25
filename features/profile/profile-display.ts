import type { ParrotProfile, ProfileDraft } from './profile-types';

export const SPECIES_KO: Record<string, string> = {
  'african-grey': '회색앵무',
  cockatoo: '코카투',
  budgie: '사랑앵무',
  parakeet: '잉꼬',
  lovebird: '모란앵무',
  conure: '코뉴어',
};

export function speciesLabel(species: string): string {
  const trimmed = species.trim();
  if (!trimmed) return '';
  return SPECIES_KO[trimmed] ?? trimmed;
}

export function toDraft(profile: ParrotProfile): ProfileDraft {
  return {
    ageMonths: profile.ageMonths,
    name: profile.name,
    photoUri: profile.photoUri,
    species: profile.species,
  };
}
