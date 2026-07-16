import type { ParrotProfile, ProfileDraft } from './profile-types';

export function toDraft(profile: ParrotProfile): ProfileDraft {
  return {
    ageMonths: profile.ageMonths,
    name: profile.name,
    photoUri: profile.photoUri,
    species: profile.species,
  };
}
