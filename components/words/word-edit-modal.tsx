import { useEffect, useState, type PropsWithChildren } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Chip, type ChipTone } from '@/components/ui/chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PillButton } from '@/components/ui/pill-button';
import { RecordingFormCard } from '@/components/words/forms/recording-form-card';
import { RecordedPlaybackRow } from '@/components/words/recorder/recorded-playback-row';
import { formatRecordingTime } from '@/components/words/recorder/recording-time';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useAudioRecording } from '@/features/audio/hooks/use-audio-recording';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import { WORD_TAGS, type WordEntry, type WordTag } from '@/features/word-library/word-library-types';

interface WordEditModalProps {
  visible: boolean;
  entry: WordEntry | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

const isIPad = Platform.OS === 'ios' && Platform.isPad;

export function WordEditModal({ visible, entry, onClose, onSaved, onDeleted }: WordEditModalProps) {
  const { t } = useI18n();
  const { updateEntry, deleteEntry } = useWordLibrary();
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [tag, setTag] = useState<WordTag>('인사');
  const [isRerecording, setIsRerecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // 'auto' detent는 footer 높이를 시트 높이에 포함하지 않아, footer가 콘텐츠를 덮는다.
  // footer 높이를 측정해 body 하단에 동일한 공간을 예약함으로써 겹침을 방지한다.
  const [footerHeight, setFooterHeight] = useState(0);

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });
  const preview = useAudioPreview(recording.recordingFile?.uri ?? null, 1, recording.elapsedSeconds);
  const entryPreview = useAudioPreview(
    entry?.sourceType === 'recording' ? entry.audioUri : null,
    1,
  );

  useEffect(() => {
    if (!entry) return;
    setLabel(entry.label);
    setTag(entry.tag);
    setIsRerecording(false);
    setConfirmDelete(false);
  }, [entry]);

  const canSave =
    label.trim().length > 0 &&
    (!isRerecording || (recording.lifecycle === 'recorded' && recording.recordingFile !== null));

  function handleClose() {
    preview.stopPreview();
    entryPreview.stopPreview();
    recording.resetRecording();
    setIsRerecording(false);
    setConfirmDelete(false);
    onClose();
  }

  function handleToggleEntryPreview() {
    if (entryPreview.previewState === 'playing') {
      entryPreview.stopPreview();
      return;
    }
    void entryPreview.playPreview();
  }

  async function handleSave() {
    if (!entry || !canSave) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const didRerecord = isRerecording && recording.recordingFile !== null;
      const pitchTransform =
        didRerecord && entry.sourceType === 'recording' && !entry.pitchTransform
          ? createMvpPitchTransform(nowIso)
          : entry.pitchTransform;

      await updateEntry({
        ...entry,
        label: label.trim(),
        tag,
        audioUri: didRerecord && recording.recordingFile ? recording.recordingFile.uri : entry.audioUri,
        transformedAudioUri: didRerecord ? undefined : entry.transformedAudioUri,
        pitchTransform,
        updatedAt: nowIso,
      });
      handleClose();
      onSaved();
    } catch (error: unknown) {
      reportError(error, { scope: 'words.updateEntry' });
      Alert.alert('저장 실패', '단어를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!entry) return;
    setIsSaving(true);
    try {
      await deleteEntry(entry.id);
      handleClose();
      onDeleted();
    } catch (error: unknown) {
      reportError(error, { scope: 'words.deleteEntry' });
      Alert.alert('삭제 실패', '단어를 삭제하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleStartRerecord() {
    entryPreview.stopPreview();
    recording.resetRecording();
    setConfirmDelete(false);
    setIsRerecording(true);
  }

  // 액션 버튼은 footer로 전달 → 시트 하단 베젤에 고정(배경은 베젤까지, 버튼은 홈 인디케이터 위).
  const footer = (
    <View
      onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      style={[styles.footerBar, { paddingBottom: isIPad ? 0 : insets.bottom }]}>
      {confirmDelete ? (
        <View style={styles.deleteConfirm}>
          <Text style={styles.deleteConfirmText}>&quot;{entry?.label}&quot; 단어를 삭제할까요?</Text>
          <View style={styles.actions}>
            <PillButton
              disabled={isSaving}
              label={t('common.cancel')}
              onPress={() => setConfirmDelete(false)}
              style={styles.flexAction}
              variant="ghost"
            />
            <PillButton
              disabled={isSaving}
              label={t('wordEdit.delete')}
              onPress={handleConfirmDelete}
              style={styles.flexAction}
              variant="red"
            />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <PillButton
            disabled={isSaving}
            icon="xmark"
            label={t('wordEdit.delete')}
            onPress={() => setConfirmDelete(true)}
            style={styles.deleteAction}
            variant="white"
          />
          <PillButton
            disabled={!canSave || isSaving}
            icon="checkmark"
            label={isSaving ? t('common.saving') : t('common.save')}
            onPress={handleSave}
            style={styles.flexAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );

  return (
    <BottomSheet footer={footer} onClose={handleClose} visible={visible}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('wordEdit.title')}</Text>
        <Pressable accessibilityLabel="닫기" accessibilityRole="button" onPress={handleClose} style={styles.closeBtn}>
          <IconSymbol name="xmark" size={24} color={BuddyBirdColors.inkMuted} />
        </Pressable>
      </View>

      <View style={[styles.body, { paddingBottom: footerHeight }]}>
        <SheetField label={t('wordCreate.wordLabel')}>
          <TextInput
            onChangeText={setLabel}
            placeholder={t('wordCreate.labelPlaceholder')}
            placeholderTextColor={BuddyBirdColors.placeholderMuted}
            returnKeyType="done"
            style={styles.input}
            value={label}
          />
        </SheetField>

        <SheetField label={t('wordCreate.categoryLabel')}>
          <View style={styles.tagRow}>
            {WORD_TAGS.map((wordTag) => (
              <Chip
                active={tag === wordTag}
                key={wordTag}
                label={wordTag}
                onPress={() => setTag(wordTag)}
                tone={toneByTag[wordTag] ?? 'primary'}
              />
            ))}
          </View>
        </SheetField>

        {entry?.sourceType === 'recording' && (
          isRerecording ? (
            <RecordingFormCard
              body={t('sessionSetup.recordingBody')}
              elapsedSeconds={recording.elapsedSeconds}
              errorMessage={recording.errorMessage}
              isPlaying={preview.previewState === 'playing'}
              label={t('wordCreate.recorderKicker')}
              lifecycle={recording.lifecycle}
              metering={recording.metering}
              onPlay={preview.playPreview}
              onReset={recording.resetRecording}
              onStart={recording.requestAndStartRecording}
              onStop={recording.stopRecording}
              onStopPlay={preview.stopPreview}
              playElapsedSeconds={preview.elapsedSeconds}
              recordedStatusLabel={t('sessionSetup.recordedStatus')}
              recordingStatusLabel={t('sessionSetup.recordingStatus')}
              rerecordLabel={t('sessionSetup.rerecord')}
              startLabel={t('sessionSetup.startRecording')}
              stopLabel={t('sessionSetup.stopRecording')}
            />
          ) : (
            <SheetField label={t('wordCreate.recorderKicker')}>
              <View style={styles.recordedGroup}>
                <RecordedPlaybackRow
                  tag={tag}
                  title={label}
                  sourceLabel={t('wordLibrary.sourceRecording')}
                  isPlaying={entryPreview.previewState === 'playing'}
                  elapsedSecondsLabel={
                    entryPreview.previewState === 'playing'
                      ? formatRecordingTime(entryPreview.elapsedSeconds)
                      : null
                  }
                  onToggle={handleToggleEntryPreview}
                />
                <PillButton
                  full
                  icon="mic"
                  label={t('sessionSetup.rerecord')}
                  onPress={handleStartRerecord}
                  variant="ghost"
                />
              </View>
            </SheetField>
          )
        )}

      </View>
    </BottomSheet>
  );
}

function SheetField({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  body: {
    gap: 16,
    paddingBottom: 0,
    paddingHorizontal: 22,
  },
  footerBar: {
    backgroundColor: BuddyBirdColors.surface,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  headerTitle: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.label,
    color: BuddyBirdColors.inkMuted,
  },
  input: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 2,
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recordedGroup: {
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
  },
  deleteAction: {
    flexBasis: 104,
    flexGrow: 0,
  },
  flexAction: {
    flex: 1,
  },
  deleteConfirm: {
    gap: 10,
    paddingTop: 6,
  },
  deleteConfirmText: {
    color: BuddyBirdColors.accentCoral,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});

const toneByTag: Record<string, ChipTone> = {
  인사: 'primary',
  음식: 'blue',
  이름: 'purple',
  기타: 'primary',
};
