import { createContext, useContext, type ReactNode } from 'react';

import { useAppUpdate, type UseAppUpdateResult } from './hooks/use-app-update';

const AppUpdateContext = createContext<UseAppUpdateResult | null>(null);

/**
 * 업데이트 프롬프트 판정을 앱 전체에서 한 번만 돌린다. 팝업을 그리는 `AppUpdateGate` 뿐 아니라,
 * 업데이트 다음 순서로 떠야 하는 다른 팝업도 이 상태를 읽는다.
 */
export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const value = useAppUpdate();

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdateContext(): UseAppUpdateResult {
  const value = useContext(AppUpdateContext);

  if (value === null) {
    throw new Error('useAppUpdateContext must be used within AppUpdateProvider');
  }

  return value;
}
