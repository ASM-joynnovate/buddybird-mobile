import type { AppLocale } from '@/features/i18n/i18n-resources';

import type { RemoteVersionInfo, UpdatePrompt } from './app-update-types';
import { isVersionBelow } from './app-update-version';

interface DecideUpdateInput {
  currentVersion: string;
  info: RemoteVersionInfo;
  dismissedVersion: string | null;
  locale: AppLocale;
}

/**
 * 설치 버전·원격 정보·거부 이력으로 표시할 프롬프트를 판정한다. 표시할 것이 없으면 `null`.
 *
 * - `min_supported_version` 미만이면 **강제**(거부 이력 무시).
 * - 그 외 설치 버전 < 최신이면 **소프트**. 단 이 최신 버전을 이미 거부했으면 미표시(버전당 1회).
 * - 릴리즈 노트는 현재 로케일 → `en` 순으로 폴백한다.
 */
export function decideUpdate({
  currentVersion,
  info,
  dismissedVersion,
  locale,
}: DecideUpdateInput): UpdatePrompt | null {
  const releaseNotes = info.releaseNotesByLocale[locale] ?? info.releaseNotesByLocale.en ?? [];

  if (info.minSupportedVersion && isVersionBelow(currentVersion, info.minSupportedVersion)) {
    return { kind: 'forced', latestVersion: info.latestVersion, releaseNotes };
  }

  if (isVersionBelow(currentVersion, info.latestVersion)) {
    if (dismissedVersion === info.latestVersion) {
      return null;
    }
    return { kind: 'soft', latestVersion: info.latestVersion, releaseNotes };
  }

  return null;
}
