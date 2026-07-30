import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';
import { FeedbackPromptHost } from '@/components/app/feedback-prompt-host';
import { PetScreen } from '@/components/layout/pet-screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { SessionRecoveryBanner } from '@/components/session/session-recovery-banner';
import { CycleSummary } from '@/components/session/setup/cycle-summary';
import { SessionPresetCard } from '@/components/session/setup/session-preset-card';
import { WordPicker } from '@/components/session/setup/word-picker';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useSessionSetup } from '@/features/training/hooks/use-learning-setup';
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
      <ScreenHeader title={t('sessionSetup.title')} body={t('sessionSetup.body')} />
      <SessionRecoveryBanner />
      <WordPicker
        items={pickerItems}
        selectedId={selectedEntryId}
        onSelect={setSelectedEntryId}
        sectionTitle={t('home.wordsSectionTitle')}
        emptyLabel={t('sessionSetupExtra.emptyLibrary')}
      />

      <View style={styles.timeSection}>
        <Text style={styles.sectionTitle}>{t('home.durationSectionTitle')}</Text>
        <SessionPresetCard
          presetKey={setup.presetKey}
          onSelectPreset={setup.setPresetKey}
          sessionMins={setup.sessionMins}
          onChangeSessionMins={setup.setSessionMins}
        />
        <CycleSummary sessionMins={setup.sessionMins} learnSecs={setup.learnSecs} restSecs={setup.restSecs} />
      </View>

      <InlineError message={setup.trainingErrorMessage} />
      <InlineError message={setup.saveErrorMessage} />
      <InlineError message={setup.durationValidationError} />

      <PillButton
        disabled={!canContinue}
        full
        icon="play.fill"
        label={startLabel}
        onPress={handleStart}
        size="lg"
        variant="primary"
        accessibilityLabel={canContinue ? startLabel : t('home.startDisabledA11y')}
      />

      <FeedbackPromptHost />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
    paddingHorizontal: Spacing.xl,
  },
  timeSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: BuddyBirdColors.ink,
  },
});
