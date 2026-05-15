import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PillButton } from '@/components/ui/pill-button';
import { FrequencyTuningFormCard, type PitchToneChoice } from '@/components/words/forms/frequency-tuning-form-card';
import { RecordingFormCard } from '@/components/words/forms/recording-form-card';
import { WordLabelField } from '@/components/words/forms/word-label-field';
import { WordTagField } from '@/components/words/forms/word-tag-field';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useAudioRecording } from '@/features/audio/hooks/use-audio-recording';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import { WORD_TAGS, type WordTag } from '@/features/word-library/word-library-types';

interface WordCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function WordCreateModal({ visible, onClose, onCreated }: WordCreateModalProps) {
  const { t } = useI18n();
  const { createEntry } = useWordLibrary();
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [tag, setTag] = useState<WordTag>('인사');
  const [toneChoice, setToneChoice] = useState<PitchToneChoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRerecording, setIsRerecording] = useState(false);

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const preview = useAudioPreview(recording.recordingFile?.uri ?? null, 1, recording.elapsedSeconds);

  useEffect(() => {
    if (recording.lifecycle !== 'idle' && recording.lifecycle !== 'requesting-permission') {
      setIsRerecording(false);
    }
  }, [recording.lifecycle]);

  const canSave =
    recording.lifecycle === 'recorded' && recording.recordingFile !== null && label.trim().length > 0 && toneChoice !== null;

  function handleClose() {
    recording.resetRecording();
    setLabel('');
    setTag('인사');
    setToneChoice(null);
    onClose();
  }

  async function handleRerecord() {
    setIsRerecording(true);
    recording.resetRecording();
    await recording.requestAndStartRecording();
  }

  async function handleSave() {
    if (!canSave || !recording.recordingFile) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = toneChoice === 'parrot' ? createMvpPitchTransform(nowIso) : undefined;
      await createEntry({
        label: label.trim(),
        tag,
        sourceType: 'recording',
        audioUri: recording.recordingFile.uri,
        pitchTransform,
      });
      handleClose();
      onCreated();
    } catch (error: unknown) {
      reportError(error, { scope: 'words.createEntry' });
      Alert.alert('저장 실패', '단어를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('wordCreate.title')}</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeBtnText}>{t('wordCreate.cancel')}</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <RecordingFormCard
            label={t('wordCreate.step1Recording')}
            body={t('sessionSetup.recordingBody')}
            metering={recording.metering}
            lifecycle={recording.lifecycle}
            elapsedSeconds={recording.elapsedSeconds}
            recordingStatusLabel={t('sessionSetup.recordingStatus')}
            recordedStatusLabel={t('sessionSetup.recordedStatus')}
            startLabel={t('sessionSetup.startRecording')}
            stopLabel={t('sessionSetup.stopRecording')}
            rerecordLabel={t('sessionSetup.rerecord')}
            errorMessage={recording.errorMessage}
            isRerecording={isRerecording}
            isPlaying={preview.previewState === 'playing'}
            playElapsedSeconds={preview.elapsedSeconds}
            onPlay={preview.playPreview}
            onStopPlay={preview.stopPreview}
            onStart={recording.requestAndStartRecording}
            onStop={recording.stopRecording}
            onReset={handleRerecord}
          />

          <WordLabelField
            sectionKicker={t('wordCreate.step2Label')}
            label={label}
            placeholder={t('wordCreate.labelPlaceholder')}
            onChange={setLabel}
          />

          <WordTagField
            sectionKicker={t('wordCreate.step3Tag')}
            tags={WORD_TAGS}
            selected={tag}
            onSelect={setTag}
          />

          <FrequencyTuningFormCard
            choice={toneChoice}
            onChangeChoice={setToneChoice}
          />

          <PillButton
            disabled={!canSave || isSaving}
            full
            label={isSaving ? t('common.saving') : t('wordCreate.save')}
            onPress={handleSave}
            size="lg"
            variant="teal"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
    fontSize: 20,
  },
  closeBtn: {
    backgroundColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  closeBtnText: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    gap: Spacing.sectionY,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 12,
  },
});
