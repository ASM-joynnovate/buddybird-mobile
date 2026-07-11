import { getApp } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  setConfigSettings,
  setDefaults,
} from '@react-native-firebase/remote-config';

import { SUPPORTED_LOCALES, type AppLocale } from '@/features/i18n/i18n-resources';

import type { RemoteVersionInfo } from './app-update-types';

/**
 * 업데이트 체크 최소 간격(6h). Remote Config 자체 캐시 간격과 앱단 포그라운드 게이트를
 * 같은 값으로 맞춰, 실행/복귀가 잦아도 네트워크 fetch 를 6h 에 1회로 제한한다.
 */
export const APP_UPDATE_MIN_FETCH_INTERVAL_MS = 6 * 60 * 60 * 1000;

const PARAM_LATEST_VERSION = 'latest_version';
const PARAM_MIN_SUPPORTED_VERSION = 'min_supported_version';
const PARAM_RELEASE_NOTES = 'release_notes';

// in-app 기본값 — 최초 오프라인 실행(fetch 실패)에서도 "업데이트 없음"으로 안전하게 처리된다.
// latest_version 을 빈 문자열로 두면 버전 비교가 파싱 불가 → 팝업 미표시(안전측).
const CONFIG_DEFAULTS = {
  [PARAM_LATEST_VERSION]: '',
  [PARAM_MIN_SUPPORTED_VERSION]: '',
  [PARAM_RELEASE_NOTES]: '{}',
} as const;

/**
 * Remote Config 에서 원격 버전 정보를 fetch·파싱한다. 네트워크·파싱 실패 시 `null`
 * (호출자는 팝업 미표시). Firebase 는 modular API 만 사용한다(CLAUDE.md 규칙).
 */
export async function fetchRemoteVersionInfo(): Promise<RemoteVersionInfo | null> {
  try {
    const remoteConfig = getRemoteConfig(getApp());

    await setConfigSettings(remoteConfig, {
      minimumFetchIntervalMillis: APP_UPDATE_MIN_FETCH_INTERVAL_MS,
    });
    await setDefaults(remoteConfig, CONFIG_DEFAULTS);
    await fetchAndActivate(remoteConfig);

    const latestVersion = getValue(remoteConfig, PARAM_LATEST_VERSION).asString().trim();
    if (latestVersion.length === 0) {
      return null;
    }

    const minRaw = getValue(remoteConfig, PARAM_MIN_SUPPORTED_VERSION).asString().trim();
    const releaseNotesRaw = getValue(remoteConfig, PARAM_RELEASE_NOTES).asString();

    return {
      latestVersion,
      minSupportedVersion: minRaw.length > 0 ? minRaw : null,
      releaseNotesByLocale: parseReleaseNotes(releaseNotesRaw),
    };
  } catch (error: unknown) {
    console.warn('[app-update.fetchRemoteVersionInfo]', error);
    return null;
  }
}

/**
 * `release_notes` JSON(`{ "ko": [...], "en": [...] }`)을 로케일별 문자열 배열로 파싱한다.
 * 지원 로케일 키만, 문자열 항목만 취한다. 손상 시 빈 맵.
 */
function parseReleaseNotes(raw: string): Partial<Record<AppLocale, readonly string[]>> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const source = parsed as Record<string, unknown>;
    const result: Partial<Record<AppLocale, readonly string[]>> = {};

    for (const locale of SUPPORTED_LOCALES) {
      const value = source[locale];
      if (Array.isArray(value)) {
        result[locale] = value.filter((item): item is string => typeof item === 'string');
      }
    }

    return result;
  } catch (error: unknown) {
    console.warn('[app-update.parseReleaseNotes]', error);
    return {};
  }
}
