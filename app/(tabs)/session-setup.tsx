import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { ScreenHeader } from '@/components/layout/screen-header';
import { AudioSourceToggle } from '@/components/session/setup/audio-source-toggle';
import { CycleSummary } from '@/components/session/setup/cycle-summary';
import { FrequencyTuningCard } from '@/components/session/setup/frequency-tuning-card';
import { PresetWordPicker } from '@/components/session/setup/preset-word-picker';
import { RecordingCard } from '@/components/session/setup/recording-card';
import { SessionDurationCard } from '@/components/session/setup/session-duration-card';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { useSessionSetup } from '@/features/training/hooks/use-session-setup';
import { useTrainingData } from '@/features/training/training-context';

export default function SessionSetupScreen() {
  const { t } = useI18n();
  const { setPendingSession } = useTrainingData();
  const setup = useSessionSetup();

  async function handleStart(): Promise<void> {
    const result = await setup.saveSessionSetup();
    if (!result) return;
    setPendingSession({
      wordId: result.wordId,
      settings: result.settings,
      audioUri: result.audioUri,
      word: setup.selectedPreset.word,
    });
    router.push('/session-active');
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <ScreenHeader
        kicker={t('sessionSetup.kicker')}
        title={t('sessionSetup.title')}
        body={t('sessionSetup.body')}
      />

      <AudioSourceToggle
        audioSource={setup.audioSource}
        label={t('sessionSetup.sourceLabel')}
        presetLabel={t('sessionSetup.presetSource')}
        recordingLabel={t('sessionSetup.recordingSource')}
        onSelectPreset={() => {
          setup.setAudioSource('preset');
          setup.recording.resetRecording();
        }}
        onSelectRecording={() => setup.setAudioSource('recording')}
      />

      <CycleSummary
        sessionMins={setup.sessionMins}
        learnSecs={setup.learnSecs}
        restSecs={setup.restSecs}
        totalCycles={setup.totalCycles}
      />

      <SessionDurationCard
        sessionMins={setup.sessionMins}
        learnSecs={setup.learnSecs}
        restSecs={setup.restSecs}
        onChangeSessionMins={setup.setSessionMins}
        onChangeLearnSecs={setup.setLearnSecs}
        onChangeRestSecs={setup.setRestSecs}
      />

      {setup.audioSource === 'preset' && (
        <PresetWordPicker
          selectedKey={setup.selectedPresetKey}
          onSelect={setup.setSelectedPresetKey}
          getSessionCount={setup.getPresetSessionCount}
        />
      )}

      {setup.audioSource === 'recording' && (
        <RecordingCard
          label={t('sessionSetup.recordingLabel')}
          body={t('sessionSetup.recordingBody')}
          metering={setup.recording.metering}
          lifecycle={setup.recording.lifecycle}
          recordingStatusLabel={t('sessionSetup.recordingStatus')}
          recordedStatusLabel={t('sessionSetup.recordedStatus')}
          startLabel={t('sessionSetup.startRecording')}
          stopLabel={t('sessionSetup.stopRecording')}
          rerecordLabel={t('sessionSetup.rerecord')}
          errorMessage={setup.recording.errorMessage}
          onStart={setup.recording.requestAndStartRecording}
          onStop={setup.recording.stopRecording}
          onReset={setup.recording.resetRecording}
        />
      )}

      {setup.audioSource === 'recording' && (
        <FrequencyTuningCard
          target={setup.target}
          persona={setup.persona}
          onChangeTarget={setup.setTarget}
          onChangePersona={setup.setPersona}
        />
      )}

      <InlineError message={setup.trainingErrorMessage} />
      <InlineError message={setup.saveErrorMessage} />

      <PillButton
        disabled={!setup.canContinue}
        full
        label={
          setup.audioSource === 'preset'
            ? `세션 시작 · "${setup.selectedPreset.word}" · ${setup.totalCycles}사이클`
            : `세션 시작 · 녹음 파일 · ${setup.totalCycles}사이클`
        }
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
