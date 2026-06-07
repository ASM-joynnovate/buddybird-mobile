import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { ProfileDraft } from './profile-types';

interface OnboardingDraftContextValue {
  draft: Partial<ProfileDraft>;
  setDraft: (nextDraft: Partial<ProfileDraft>) => void;
}

const OnboardingDraftContext = createContext<OnboardingDraftContextValue | null>(null);

export function OnboardingDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraftState] = useState<Partial<ProfileDraft>>({});

  const setDraft = useCallback((nextDraft: Partial<ProfileDraft>): void => {
    setDraftState((currentDraft) => ({
      ...currentDraft,
      ...nextDraft,
    }));
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
    }),
    [draft, setDraft]
  );

  return <OnboardingDraftContext.Provider value={value}>{children}</OnboardingDraftContext.Provider>;
}

export function useOnboardingDraft(): OnboardingDraftContextValue {
  const context = useContext(OnboardingDraftContext);

  if (!context) {
    throw new Error('useOnboardingDraft must be used inside OnboardingDraftProvider');
  }

  return context;
}
