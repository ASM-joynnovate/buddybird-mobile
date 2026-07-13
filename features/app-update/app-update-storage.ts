import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

export const APP_UPDATE_STORAGE_KEY = '@buddybird/app-update';

/**
 * 업데이트 프롬프트의 로컬 상태.
 * - `dismissedVersion`: 소프트 프롬프트에서 '취소'한 최신 버전. 더 새 버전이 나오기 전까지
 *   재노출하지 않기 위한 기준(버전당 1회). 강제 프롬프트는 이 값을 무시한다.
 * - `lastCheckedAt`: 마지막 원격 체크 시각(epoch ms). 포그라운드 복귀 시 간격 게이트에 쓴다.
 */
export interface AppUpdateState {
  dismissedVersion: string | null;
  lastCheckedAt: number | null;
}

const FALLBACK: AppUpdateState = { dismissedVersion: null, lastCheckedAt: null };

// 손상/검증 실패는 표면화하지 않고 조용히 기본값으로 복구(recover 미지정 → fallback).
// 손상 보고는 seam 의 reportError 로 일관화된다.
const store = persistKeyedStore<AppUpdateState>({
  key: APP_UPDATE_STORAGE_KEY,
  scope: 'app-update.loadState',
  parse: parseState,
  fallback: () => ({ ...FALLBACK }),
});

export async function loadAppUpdateState(): Promise<AppUpdateState> {
  return store.load();
}

export async function saveDismissedVersion(version: string): Promise<void> {
  const current = await store.load();
  await store.save({ ...current, dismissedVersion: version });
}

export async function saveLastCheckedAt(timestamp: number): Promise<void> {
  const current = await store.load();
  await store.save({ ...current, lastCheckedAt: timestamp });
}

function parseState(raw: unknown): AppUpdateState {
  if (!raw || typeof raw !== 'object') {
    return { ...FALLBACK };
  }

  const value = raw as Partial<AppUpdateState>;

  return {
    dismissedVersion: typeof value.dismissedVersion === 'string' ? value.dismissedVersion : null,
    lastCheckedAt: typeof value.lastCheckedAt === 'number' ? value.lastCheckedAt : null,
  };
}
