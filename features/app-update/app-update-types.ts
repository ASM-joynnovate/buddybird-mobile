import type { AppLocale } from '@/features/i18n/i18n-resources';

/**
 * 업데이트 판정 종류.
 * - `none`: 최신이거나(설치 ≥ latest) 이미 이 버전을 거부함 → 팝업 없음
 * - `soft`: 새 버전 있음, 취소 가능한 팝업
 * - `forced`: 설치 버전이 `min_supported_version` 미만 → 취소 불가 팝업
 */
export type UpdateDecisionKind = 'none' | 'soft' | 'forced';

/** Remote Config 에서 읽어온 원격 버전 정보 (파싱·검증 완료 형태). */
export interface RemoteVersionInfo {
  /** 스토어 최신 marketing semver (예: `0.6.0`). */
  latestVersion: string;
  /** 이 미만이면 강제 업데이트. 없으면 강제 게이트 미적용. */
  minSupportedVersion: string | null;
  /** 로케일별 릴리즈 노트. 앱이 현재 로케일로 선택하고 없으면 `en` 으로 폴백한다. */
  releaseNotesByLocale: Partial<Record<AppLocale, readonly string[]>>;
}

/** 화면에 표시할 업데이트 프롬프트. `kind === 'none'` 이면 표시하지 않는다. */
export interface UpdatePrompt {
  kind: Exclude<UpdateDecisionKind, 'none'>;
  /** 헤더에 표시할 최신 semver. */
  latestVersion: string;
  /** 바디에 표시할, 로케일이 이미 선택된 릴리즈 노트 목록. */
  releaseNotes: readonly string[];
}
