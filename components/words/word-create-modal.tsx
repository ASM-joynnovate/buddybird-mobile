import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
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
import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { useRecordingSession } from '@/features/audio/hooks/use-recording-session';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordTag } from '@/features/word-library/word-library-types';

// optional 파라미터라 조회 실패 시 생략한다 — 사이즈 계측 실패가 등록 이벤트를 막으면 안 된다.
function readAudioSizeBytes(uri: string): number | undefined {
  try {
    const size = new File(uri).size;
    return typeof size === 'number' && size >= 0 ? size : undefined;
  } catch (error: unknown) {
    console.warn('[words.audioSizeBytes]', error);
    return undefined;
  }
}

interface WordCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function WordCreateModal({ visible, onClose, onCreated }: WordCreateModalProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { createEntry } = useWordLibrary();
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [tag, setTag] = useState<WordTag>('greeting');
  const [isSaving, setIsSaving] = useState(false);

  // 재녹음 횟수(retry_count). 자동 정지(maxDuration)도 잡기 위해 버튼 핸들러가 아니라
  // lifecycle 전이로 발화하므로, 부가 상태도 ref로 함께 추적한다.
  const labelRef = useRef(label);
  labelRef.current = label;
  const retryCountRef = useRef(0);
  const hadRecordingRef = useRef(false);

  const session = useRecordingSession({
    messages: {
      permissionDenied: t('recording.permissionDenied'),
      saveFailed: t('recording.saveFailed'),
      startFailed: t('recording.startFailed'),
      blockedBySession: t('recording.blockedBySession'),
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

  // 녹음 시작/종료 이벤트는 lifecycle 전이로 발화한다 — 버튼 핸들러에서 발화하면
  // maxDuration 자동 정지 경로의 word_recording_finished 가 누락된다.
  const prevLifecycleRef = useRef(session.state);
  useEffect(() => {
    const prev = prevLifecycleRef.current;
    prevLifecycleRef.current = session.state;
    if (prev === session.state) return;
    if (session.state === 'recording') {
      if (hadRecordingRef.current) retryCountRef.current += 1;
      track({ name: 'word_recording_started', params: { word_name: labelRef.current.trim() } });
      return;
    }
    if (prev === 'recording' && session.state === 'recorded') {
      hadRecordingRef.current = true;
      track({
        name: 'word_recording_finished',
        params: {
          word_name: labelRef.current.trim(),
          recording_duration_ms: session.recordedDurationMs ?? session.elapsedSeconds * 1000,
          retry_count: retryCountRef.current,
        },
      });
    }
  }, [session.state, session.elapsedSeconds, session.recordedDurationMs, track]);

  const canSave = session.ui.canPlayback && label.trim().length > 0;
  const recorderStatusLabel = session.ui.statusLabel ?? '';

  function handleClose() {
    session.actions.reset();
    setLabel('');
    setTag('greeting');
    retryCountRef.current = 0;
    hadRecordingRef.current = false;
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
      const entry = await createEntry({
        label: label.trim(),
        tag,
        sourceType: 'recording',
        audioUri: session.file.uri,
        pitchProfileId: undefined,
      });
      const audioSizeBytes = readAudioSizeBytes(session.file.uri);
      track({
        name: 'word_added',
        params: {
          word_id: entry.id,
          word_name: entry.label,
          category: tag,
          // 현행 생성 플로우는 녹음이 필수라 등록 방식이 단일하다.
          registration_method: 'voice_recording',
          recording_duration_ms: session.recordedDurationMs ?? session.elapsedSeconds * 1000,
          ...(audioSizeBytes !== undefined ? { audio_size_bytes: audioSizeBytes } : {}),
        },
      });
      handleClose();
      onCreated();
    } catch (error: unknown) {
      reportError(error, { scope: 'words.createEntry' });
      Alert.alert(t('wordCreate.saveErrorTitle'), t('wordCreate.saveErrorBody'));
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
              metering={session.metering}
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
