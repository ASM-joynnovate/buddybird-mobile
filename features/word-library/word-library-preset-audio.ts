// require()는 정적 문자열만 허용하므로 각 파일을 개별 등록한다.
const PRESET_AUDIO_MODULES: Record<string, number> = {
  hello: require('@/assets/audio/default_An-nyeong.m4a'),
  apple: require('@/assets/audio/default_Sa-gwa.m4a'),
  saranghae: require('@/assets/audio/default_Sa-rang-hae.m4a'),
  bye: require('@/assets/audio/default_Da-nyeo-wa.m4a'),
};

// expo-audio의 useAudioPlayer / player.replace()는 require() 모듈 번호를 직접 받을 수 있다.
// URI 문자열 변환 없이 모듈 번호를 그대로 반환한다.
export function resolvePresetAudioModule(presetKey: string | undefined): number | null {
  if (!presetKey) return null;
  return PRESET_AUDIO_MODULES[presetKey] ?? null;
}
