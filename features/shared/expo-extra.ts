// app.config.ts `extra` 설정값 읽기 — 비어 있지 않은 문자열만 유효값으로 취급한다.

import Constants from 'expo-constants';

export function readExtraString(key: string): string | null {
  const value = Constants.expoConfig?.extra?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
