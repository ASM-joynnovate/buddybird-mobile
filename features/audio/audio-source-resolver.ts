// "오디오 소스를 어떻게 해석하나"의 single source of truth.
// preset:// 판별과 preset→module 매핑을 한곳에 모은다. 호출부(word-row, training setup)는
// 자체적으로 preset:// 를 판별하거나 preset 모듈을 재해석하지 않고 이 모듈만 소비한다.
// `recording://` 정규화/hydration 은 recordings 디렉토리 스킴과 묶여 audio-file-storage 가
// 소유하며, 그 모듈도 preset:// 판별은 여기의 `isPresetUri` 로 위임한다.

export const PRESET_URI_PREFIX = 'preset://';

// require()는 정적 문자열만 허용하므로 각 파일을 개별 등록한다.
// 키는 로케일 무관 단일 네임스페이스 (word-library-model 의 SEED_PRESETS_BY_LOCALE 와 1:1).
// 프리셋 음원은 현재 ko 만 제공 — 새 로케일 음원 추가 시 assets/audio/<locale-dir>/ 에 배치한다.
const PRESET_AUDIO_MODULES: Record<string, number> = {
  hello: require('@/assets/audio/ko-kr/default_An-nyeong.m4a'),
  apple: require('@/assets/audio/ko-kr/default_Sa-gwa.m4a'),
  saranghae: require('@/assets/audio/ko-kr/default_Sa-rang-hae.m4a'),
  bye: require('@/assets/audio/ko-kr/default_Da-nyeo-wa.m4a'),
};

export function isPresetUri(uri: string | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith(PRESET_URI_PREFIX);
}

// expo-audio의 useAudioPlayer / player.replace()는 require() 모듈 번호를 직접 받을 수 있다.
// URI 문자열 변환 없이 모듈 번호를 그대로 반환한다. 매핑 미스 시 null.
function resolvePresetAudioModule(presetKey: string | undefined): number | null {
  if (!presetKey) return null;
  return PRESET_AUDIO_MODULES[presetKey] ?? null;
}

export interface AudioSourceInput {
  audioUri: string;
  transformedAudioUri?: string;
  presetKey?: string;
}

export interface ResolvedAudioSource {
  // expo-audio에 그대로 넘길 수 있는 재생 소스: preset 모듈 번호, 파일 URI 문자열,
  // 또는 preset 매핑 미스 시 null.
  source: string | number | null;
  isPreset: boolean;
}

// 재생용 오디오 소스를 해석한다. preset:// 는 모듈 번호로, 그 외(in-memory 절대 URI)는
// 그대로 통과시킨다. 변환본이 있으면 우선한다.
export function resolveAudioSource(input: AudioSourceInput): ResolvedAudioSource {
  const rawUri = input.transformedAudioUri ?? input.audioUri;
  if (isPresetUri(rawUri)) {
    return { source: resolvePresetAudioModule(input.presetKey), isPreset: true };
  }
  return { source: rawUri, isPreset: false };
}
