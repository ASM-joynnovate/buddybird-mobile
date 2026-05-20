import { StyleSheet, Text, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { CycleSummary } from '@/components/session/setup/cycle-summary';
import { SessionPresetCard } from '@/components/session/setup/session-preset-card';
import { WordPicker } from '@/components/session/setup/word-picker';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useSessionSetup } from '@/features/training/hooks/use-session-setup';
import { useSessionStart } from '@/features/training/hooks/use-session-start';
import { useWordSelection } from '@/features/training/hooks/use-word-selection';

export default function SessionSetupScreen() {
  const { t } = useI18n();
  useScreenTracking('session_setup');
  const setup = useSessionSetup();
  const { selectedEntryId, setSelectedEntryId, selectedEntry, pickerItems, isLibraryHydrated } = useWordSelection();
  const { handleStart, startLabel } = useSessionStart({ selectedEntry, setup });

  const canContinue = setup.isHydrated && isLibraryHydrated && selectedEntry !== undefined && setup.isDurationValid;

  return (
    <PetScreen contentStyle={styles.content}>
      <ScreenHeader title={t('sessionSetup.title')} />

      <WordPicker
        items={pickerItems}
        selectedId={selectedEntryId}
        onSelect={setSelectedEntryId}
        sectionTitle="학습할 단어"
        emptyLabel={t('sessionSetupExtra.emptyLibrary')}
      />

      <View style={styles.timeSection}>
        <Text style={styles.sectionTitle}>학습 시간 설정</Text>
        <CycleSummary
          sessionMins={setup.sessionMins}
          learnSecs={setup.learnSecs}
          restSecs={setup.restSecs}
        />
        <SessionPresetCard
          presetKey={setup.presetKey}
          onSelectPreset={setup.setPresetKey}
          sessionMins={setup.sessionMins}
          onChangeSessionMins={setup.setSessionMins}
        />
      </View>

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
  timeSection: {
    gap: 8,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: BuddyBirdColors.primary,
  },
});
