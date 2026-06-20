import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineError } from '@/components/ui/inline-error';
import { RecordedPlaybackRow } from '@/components/words/recorder/recorded-playback-row';
import { RecorderColorCard } from '@/components/words/recorder/recorder-color-card';
import { formatRecordingTime } from '@/components/words/recorder/recording-time';
import { WordCreateActions } from '@/components/words/word-create-actions';
import { WordCreateFields } from '@/components/words/word-create-fields';
import { WordCreateHeader } from '@/components/words/word-create-header';
import { BuddyBirdColors, Spacing } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useAudioRecording } from '@/features/audio/hooks/use-audio-recording';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordTag } from '@/features/word-library/word-library-types';

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
  const [isSaving, setIsSaving] = useState(false);

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const preview = useAudioPreview(recording.recordingFile?.uri ?? null, 1, recording.elapsedSeconds);

  useEffect(() => {
    if (!visible && preview.previewState === 'playing') {
      preview.stopPreview();
    }
  }, [preview, visible]);

  const canSave = recording.lifecycle === 'recorded' && recording.recordingFile !== null && label.trim().length > 0;
  const recorderStatusLabel = getRecorderStatusLabel({
    elapsedSeconds: recording.elapsedSeconds,
    lifecycle: recording.lifecycle,
    t,
  });

  function handleClose() {
    preview.stopPreview();
    recording.resetRecording();
    setLabel('');
    setTag('인사');
    onClose();
  }

  async function handleToggleRecording() {
    if (recording.lifecycle === 'recording') {
      await recording.stopRecording();
      return;
    }
    preview.stopPreview();
    await recording.requestAndStartRecording();
  }

  function handleTogglePreview() {
    if (preview.previewState === 'playing') {
      preview.stopPreview();
      return;
    }
    preview.playPreview();
  }

  async function handleSave() {
    if (!canSave || !recording.recordingFile) return;
    setIsSaving(true);
    try {
      await createEntry({
        label: label.trim(),
        tag,
        sourceType: 'recording',
        audioUri: recording.recordingFile.uri,
        pitchTransform: undefined,
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
        <WordCreateHeader
          body={t('wordCreate.body')}
          kicker={t('wordCreate.kicker')}
          onBack={handleClose}
          title={t('wordCreate.title')}
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <WordCreateFields
            categoryLabel={t('wordCreate.categoryLabel')}
            label={label}
            onChangeLabel={setLabel}
            onChangeTag={setTag}
            placeholder={t('wordCreate.labelPlaceholder')}
            tag={tag}
            wordLabel={t('wordCreate.wordLabel')}
          />

          <View style={styles.recorderBlock}>
            <RecorderColorCard
              emptyLabel={t('wordCreate.emptyWord')}
              kicker={t('wordCreate.recorderKicker')}
              lifecycle={recording.lifecycle}
              onToggle={handleToggleRecording}
              statusLabel={recorderStatusLabel}
              tag={tag}
              wordLabel={label}
            />
            <InlineError message={recording.errorMessage} />
          </View>

          {recording.lifecycle === 'recorded' && !recording.isRecording ? (
            <RecordedPlaybackRow
              elapsedSecondsLabel={
                preview.previewState === 'playing' ? formatRecordingTime(preview.elapsedSeconds) : null
              }
              isPlaying={preview.previewState === 'playing'}
              onToggle={handleTogglePreview}
              sourceLabel={t('wordCreate.playbackSource')}
              tag={tag}
              title={t('wordCreate.playbackTitle')}
            />
          ) : null}

          <WordCreateActions
            cancelLabel={t('wordCreate.cancel')}
            disabled={!canSave || isSaving}
            onCancel={handleClose}
            onSave={handleSave}
            saveLabel={isSaving ? t('common.saving') : t('wordCreate.addToTraining')}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

function getRecorderStatusLabel({
  elapsedSeconds,
  lifecycle,
  t,
}: {
  elapsedSeconds: number;
  lifecycle: ReturnType<typeof useAudioRecording>['lifecycle'];
  t: ReturnType<typeof useI18n>['t'];
}): string {
  if (lifecycle === 'recording') {
    return t('wordCreate.recordingStatus', { time: formatRecordingTime(elapsedSeconds) });
  }
  if (lifecycle === 'recorded') return t('wordCreate.recordedStatus');
  if (lifecycle === 'requesting-permission') return t('wordCreate.permissionStatus');
  return t('wordCreate.readyStatus');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
  },
  content: {
    gap: 18,
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
  },
  recorderBlock: {
    gap: 8,
  },
});
