import type { PitchTransformMetadata } from './audio-types';

export const MVP_PITCH_PROFILE = {
  id: 'parrot-mvp-high',
  labelKey: 'pitch.profileName',
  playbackRate: 1.32,
  preservesPitch: false,
} as const;

export function createMvpPitchTransform(appliedAt: string): PitchTransformMetadata {
  return {
    profileId: MVP_PITCH_PROFILE.id,
    playbackRate: MVP_PITCH_PROFILE.playbackRate,
    preservesPitch: MVP_PITCH_PROFILE.preservesPitch,
    appliedAt,
  };
}
