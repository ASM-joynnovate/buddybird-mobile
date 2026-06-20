import { router } from 'expo-router';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { useProfile } from '@/features/profile/profile-context';
import { diffDaysIso } from '@/features/shared/date-utils';
import { formatDurationMins } from '@/features/shared/duration-format';
import { createSessionId } from '@/features/shared/ids';
import type { UseSessionSetupResult } from '@/features/training/hooks/use-learning-setup';
import { useTrainingData } from '@/features/training/training-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

interface SessionStartParams {
  selectedEntry: WordEntry | undefined;
  setup: Pick<UseSessionSetupResult, 'saveSessionSetup' | 'sessionMins'>;
}

export function useSessionStart({ selectedEntry, setup }: SessionStartParams) {
  const { setPendingSession } = useTrainingData();
  const { track } = useAnalytics();
  const { profile } = useProfile();

  const startLabel = selectedEntry ? `학습 시작 · ${formatDurationMins(setup.sessionMins)}` : '학습 시작';

  async function handleStart(): Promise<void> {
    if (!selectedEntry) return;
    const result = await setup.saveSessionSetup({
      audioUri: selectedEntry.audioUri,
      label: selectedEntry.label,
      presetKey: selectedEntry.presetKey,
      sourceType: selectedEntry.sourceType,
      libraryEntryId: selectedEntry.id,
    });
    if (!result) return;

    const sessionId = createSessionId();
    setPendingSession({
      sessionId,
      wordId: result.wordId,
      settings: result.settings,
      audioUri: result.audioUri,
      word: result.word,
    });
    track({
      name: 'training_session_started',
      params: {
        session_id: sessionId,
        word_count: 1,
        target_word_ids: [result.wordId],
        target_word_names: [result.word],
        profile_age_days: profile ? diffDaysIso(profile.createdAt) : 0,
        parrot_species: profile?.species ?? '',
        parrot_name: profile?.name ?? '',
      },
    });
    router.push('/session-active');
  }

  return { handleStart, startLabel };
}
