import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { CycleSummary } from '@/components/session/setup/cycle-summary';
import { SessionPresetCard } from '@/components/session/setup/session-preset-card';
import { WordPicker, type WordPickerItem } from '@/components/session/setup/word-picker';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { diffDaysIso } from '@/features/shared/date-utils';
import { createSessionId } from '@/features/shared/ids';
import { useSessionSetup } from '@/features/training/hooks/use-session-setup';
import { useTrainingData } from '@/features/training/training-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';

export default function SessionSetupScreen() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { profile } = useProfile();
  useScreenTracking('session_setup');
  const { setPendingSession } = useTrainingData();
  const { entries, isHydrated: isLibraryHydrated } = useWordLibrary();
  const setup = useSessionSetup();

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) {
      if (selectedEntryId !== null) setSelectedEntryId(null);
      return;
    }
    if (selectedEntryId === null || !entries.some((e) => e.id === selectedEntryId)) {
      setSelectedEntryId(entries[0].id);
    }
  }, [entries, selectedEntryId]);

  const pickerItems: WordPickerItem[] = entries.map((e) => ({
    id: e.id,
    label: e.label,
    tag: e.tag,
    presetKey: e.presetKey,
    sourceType: e.sourceType,
    sourceLabel: t(e.sourceType === 'preset' ? 'wordLibrary.sourcePreset' : 'wordLibrary.sourceRecording'),
  }));

  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const canContinue =
    setup.isHydrated && isLibraryHydrated && selectedEntry !== undefined && setup.isDurationValid;

  async function handleStart(): Promise<void> {
    if (!selectedEntry) return;
    const result = await setup.saveSessionSetup({
      audioUri: selectedEntry.audioUri,
      label: selectedEntry.label,
      presetKey: selectedEntry.presetKey,
      sourceType: selectedEntry.sourceType,
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

  const startLabel = selectedEntry
    ? `세션 시작 · "${selectedEntry.label}" · ${setup.totalCycles}사이클`
    : '세션 시작';

  return (
    <PetScreen contentStyle={styles.content}>
      <ScreenHeader
        kicker={t('sessionSetup.kicker')}
        title={t('sessionSetup.title')}
        body={t('sessionSetup.body')}
      />

      <CycleSummary
        sessionMins={setup.sessionMins}
        learnSecs={setup.learnSecs}
        restSecs={setup.restSecs}
        totalCycles={setup.totalCycles}
      />

      <SessionPresetCard
        presetKey={setup.presetKey}
        onSelectPreset={setup.setPresetKey}
        sessionMins={setup.sessionMins}
        learnSecs={setup.learnSecs}
        restSecs={setup.restSecs}
        onChangeSessionMins={setup.setSessionMins}
        onChangeLearnSecs={setup.setLearnSecs}
        onChangeRestSecs={setup.setRestSecs}
      />

      <WordPicker
        items={pickerItems}
        selectedId={selectedEntryId}
        onSelect={setSelectedEntryId}
        getSessionCountLabel={(item) =>
          `${setup.getSessionCountForPreset(item.presetKey)} 세션`
        }
        sectionTitle="학습할 단어"
        emptyLabel={t('sessionSetupExtra.emptyLibrary')}
      />

      <InlineError message={setup.trainingErrorMessage} />
      <InlineError message={setup.saveErrorMessage} />
      <InlineError message={setup.durationValidationError} />

      <PillButton
        disabled={!canContinue}
        full
        label={startLabel}
        onPress={handleStart}
        size="lg"
        variant="teal"
      />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
  },
});
