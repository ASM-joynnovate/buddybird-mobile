import { useEffect, useState, type PropsWithChildren } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/ui/app-text';
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
import { useRecordingSession } from '@/features/audio/hooks/use-recording-session';
import { MVP_PITCH_PROFILE } from '@/features/audio/pitch-profile';
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
  const [tag, setTag] = useState<WordTag>('greeting');
  const [isRerecording, setIsRerecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // 'auto' detent는 footer 높이를 시트 높이에 포함하지 않아, footer가 콘텐츠를 덮는다.
  // footer 높이를 측정해 body 하단에 동일한 공간을 예약함으로써 겹침을 방지한다.
  const [footerHeight, setFooterHeight] = useState(0);

  const session = useRecordingSession({
    messages: {
      permissionDenied: t('recording.permissionDenied'),
      saveFailed: t('recording.saveFailed'),
      startFailed: t('recording.startFailed'),
    },
    statusLabels: {
      recording: (seconds) => `${t('sessionSetup.recordingStatus')} · ${formatStatusTime(seconds)}`,
      recorded: (seconds, isPlaying) =>
        `${t('sessionSetup.recordedStatus')}${isPlaying ? ` · ${formatStatusTime(seconds)}` : ''}`,
    },
    maxDurationMs: 60_000,
    // 기존 entry 재생은 원본 녹음(audioUri)을 그대로 재생한다(동작 보존).
    // 신규 녹음은 절대 URI 이고 preset 이 아니므로 source-resolver 해석이 불필요하다.
    existingSource: entry?.sourceType === 'recording' ? entry.audioUri : null,
  });
  const { playback, entryPlayback } = session;

  useEffect(() => {
    if (!entry) return;
    setLabel(entry.label);
    setTag(entry.tag);
    setIsRerecording(false);
    setConfirmDelete(false);
  }, [entry]);

  const canSave = label.trim().length > 0 && (!isRerecording || session.ui.canPlayback);

  function handleClose() {
    session.actions.reset();
    setIsRerecording(false);
    setConfirmDelete(false);
    onClose();
  }

  function handleToggleEntryPreview() {
    if (entryPlayback.isPlaying) {
      entryPlayback.stop();
      return;
    }
    void entryPlayback.play();
  }

  async function handleSave() {
    if (!entry || !canSave) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const didRerecord = isRerecording && session.file !== null;
      const pitchProfileId =
        didRerecord && entry.sourceType === 'recording' && !entry.pitchProfileId
          ? MVP_PITCH_PROFILE.id
          : entry.pitchProfileId;

      await updateEntry({
        ...entry,
        label: label.trim(),
        tag,
        audioUri: didRerecord && session.file ? session.file.uri : entry.audioUri,
        transformedAudioUri: didRerecord ? undefined : entry.transformedAudioUri,
        pitchProfileId,
        updatedAt: nowIso,
      });
      handleClose();
      onSaved();
    } catch (error: unknown) {
      reportError(error, { scope: 'words.updateEntry' });
      Alert.alert(t('wordCreate.saveErrorTitle'), t('wordCreate.saveErrorBody'));
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
      Alert.alert(t('wordEdit.deleteErrorTitle'), t('wordEdit.deleteErrorBody'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleStartRerecord() {
    session.actions.reset();
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
          <Text style={styles.deleteConfirmText}>{t('wordEdit.confirmDelete', { label: entry?.label ?? '' })}</Text>
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
        <Pressable accessibilityLabel={t('wordEdit.closeA11y')} accessibilityRole="button" onPress={handleClose} style={styles.closeBtn}>
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
                label={t(`wordLibrary.tagLabels.${wordTag}`)}
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
              errorMessage={session.errorMessage}
              isPlaying={playback.isPlaying}
              label={t('wordCreate.recorderKicker')}
              lifecycle={session.state}
              metering={session.metering}
              onPlay={playback.play}
              onReset={session.actions.reset}
              onStart={session.actions.start}
              onStop={session.actions.stop}
              onStopPlay={playback.stop}
              rerecordLabel={t('sessionSetup.rerecord')}
              startLabel={t('sessionSetup.startRecording')}
              statusLabel={session.ui.statusLabel}
              stopLabel={t('sessionSetup.stopRecording')}
            />
          ) : (
            <SheetField label={t('wordCreate.recorderKicker')}>
              <View style={styles.recordedGroup}>
                <RecordedPlaybackRow
                  tag={tag}
                  title={label}
                  sourceLabel={t('wordLibrary.sourceRecording')}
                  isPlaying={entryPlayback.isPlaying}
                  elapsedSecondsLabel={
                    entryPlayback.isPlaying ? formatRecordingTime(entryPlayback.elapsedSeconds) : null
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

// 녹음/재생 상태 라벨에 붙는 MM:SS 포맷(분 2자리 패딩) — 기존 RecordingFormCard 내부 포맷을 보존한다.
function formatStatusTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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
  greeting: 'primary',
  food: 'blue',
  name: 'purple',
  etc: 'primary',
};
