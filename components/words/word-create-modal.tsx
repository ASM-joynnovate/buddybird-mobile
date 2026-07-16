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
import { useRecordingSession } from '@/features/audio/hooks/use-recording-session';
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
  const [tag, setTag] = useState<WordTag>('greeting');
  const [isSaving, setIsSaving] = useState(false);

  const session = useRecordingSession({
    messages: {
      permissionDenied: t('recording.permissionDenied'),
      saveFailed: t('recording.saveFailed'),
      startFailed: t('recording.startFailed'),
    },
    statusLabels: {
      ready: t('wordCreate.readyStatus'),
      requestingPermission: t('wordCreate.permissionStatus'),
      recording: (seconds) => t('wordCreate.recordingStatus', { time: formatRecordingTime(seconds) }),
      recorded: () => t('wordCreate.recordedStatus'),
    },
    maxDurationMs: 60_000,
  });
  const { playback } = session;

  useEffect(() => {
    if (!visible && playback.isPlaying) {
      playback.stop();
    }
  }, [playback, visible]);

  const canSave = session.ui.canPlayback && label.trim().length > 0;
  const recorderStatusLabel = session.ui.statusLabel ?? '';

  function handleClose() {
    session.actions.reset();
    setLabel('');
    setTag('greeting');
    onClose();
  }

  async function handleToggleRecording() {
    if (session.state === 'recording') {
      await session.actions.stop();
      return;
    }
    await session.actions.start();
  }

  function handleTogglePreview() {
    if (playback.isPlaying) {
      playback.stop();
      return;
    }
    void playback.play();
  }

  async function handleSave() {
    if (!canSave || !session.file) return;
    setIsSaving(true);
    try {
      await createEntry({
        label: label.trim(),
        tag,
        sourceType: 'recording',
        audioUri: session.file.uri,
        pitchProfileId: undefined,
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
              lifecycle={session.state}
              onToggle={handleToggleRecording}
              statusLabel={recorderStatusLabel}
              tag={tag}
              wordLabel={label}
            />
            <InlineError message={session.errorMessage} />
          </View>

          {session.state === 'recorded' && !session.ui.isRecording ? (
            <RecordedPlaybackRow
              elapsedSecondsLabel={
                playback.isPlaying ? formatRecordingTime(playback.elapsedSeconds) : null
              }
              isPlaying={playback.isPlaying}
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
