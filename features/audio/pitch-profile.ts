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

const MVP_BASE_RATE = MVP_PITCH_PROFILE.playbackRate;
const MVP_BASE_FREQ_KHZ = 2.8;

export function computePlaybackRate(targetKhz: number): number {
  const rate = MVP_BASE_RATE * (targetKhz / MVP_BASE_FREQ_KHZ);
  return Math.min(2.0, Math.max(0.1, rate));
}
