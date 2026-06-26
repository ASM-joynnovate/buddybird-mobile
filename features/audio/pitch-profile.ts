import type { PitchTransformMetadata } from './audio-types';

export const MVP_PITCH_PROFILE = {
  id: 'parrot-mvp-high',
  playbackRate: 1.32,
  preservesPitch: false,
} as const;

// pitch 프로필 레지스트리: profileId → 재생 파라미터. WordEntry 등 도메인 타입은 불투명한
// profileId 참조만 보유하고, 실제 pitch 파라미터 해석은 오디오 도메인인 이 모듈이 소유한다.
const PITCH_PROFILES_BY_ID: Record<string, { playbackRate: number; preservesPitch: boolean }> = {
  [MVP_PITCH_PROFILE.id]: {
    playbackRate: MVP_PITCH_PROFILE.playbackRate,
    preservesPitch: MVP_PITCH_PROFILE.preservesPitch,
  },
};

// pitch 프로필이 없거나(원본 재생) 미등록 id 일 때의 기본 배속.
export const DEFAULT_PLAYBACK_RATE = 1.0;

// profileId 를 재생 배속으로 해석한다. 미지정/미등록은 기본 배속(원본 속도)으로 떨어진다.
export function resolvePitchPlaybackRate(profileId: string | undefined): number {
  if (!profileId) return DEFAULT_PLAYBACK_RATE;
  return PITCH_PROFILES_BY_ID[profileId]?.playbackRate ?? DEFAULT_PLAYBACK_RATE;
}

export function createMvpPitchTransform(appliedAt: string): PitchTransformMetadata {
  return {
    profileId: MVP_PITCH_PROFILE.id,
    playbackRate: MVP_PITCH_PROFILE.playbackRate,
    preservesPitch: MVP_PITCH_PROFILE.preservesPitch,
    appliedAt,
  };
}
