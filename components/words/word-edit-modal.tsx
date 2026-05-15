import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { SectionKicker } from '@/components/ui/section-kicker';
import { FrequencyTuningFormCard, type PitchToneChoice } from '@/components/words/forms/frequency-tuning-form-card';
import { RecordingFormCard } from '@/components/words/forms/recording-form-card';
import { WordLabelField } from '@/components/words/forms/word-label-field';
import { WordTagField } from '@/components/words/forms/word-tag-field';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
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

export function WordEditModal({ visible, entry, onClose, onSaved, onDeleted }: WordEditModalProps) {
  const { t } = useI18n();
  const { updateEntry, deleteEntry } = useWordLibrary();
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [tag, setTag] = useState<WordTag>('인사');
  const [toneChoice, setToneChoice] = useState<PitchToneChoice>('parrot');
  const [isRerecording, setIsRerecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setLabel(entry.label);
      setTag(entry.tag);
      setToneChoice(entry.pitchTransform ? 'parrot' : 'original');
      setIsRerecording(false);
    }
  }, [entry]);

  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const canSave =
    label.trim().length > 0 &&
    (!isRerecording || (recording.lifecycle === 'recorded' && recording.recordingFile !== null));

  function handleClose() {
    recording.resetRecording();
    setIsRerecording(false);
    onClose();
  }

  async function handleSave() {
    if (!entry || !canSave) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = toneChoice === 'parrot' ? createMvpPitchTransform(nowIso) : undefined;
      const audioUri = isRerecording && recording.recordingFile ? recording.recordingFile.uri : entry.audioUri;

      await updateEntry({
        ...entry,
        label: label.trim(),
        tag,
        audioUri,
        pitchTransform,
        updatedAt: nowIso,
      });
      handleClose();
      onSaved();
    } catch (error: unknown) {
      console.warn('[words] update entry failed:', error);
      Alert.alert('저장 실패', '단어를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    if (!entry || entry.sourceType === 'preset') return;
    Alert.alert(t('wordEdit.confirmDelete'), entry.label, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('wordEdit.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entry.id);
            handleClose();
            onDeleted();
          } catch (error: unknown) {
            console.warn('[words] delete entry failed:', error);
            Alert.alert('삭제 실패', '단어를 삭제하지 못했어요. 다시 시도해 주세요.');
          }
        },
      },
    ]);
  }

  function handleStartRerecord() {
    recording.resetRecording();
    setIsRerecording(true);
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('wordEdit.title')}</Text>
          <View style={styles.headerActions}>
            {entry?.sourceType !== 'preset' && (
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>{t('wordEdit.delete')}</Text>
              </Pressable>
            )}
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>{t('wordCreate.cancel')}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          {entry?.sourceType === 'recording' && (
            isRerecording ? (
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
                onStart={recording.requestAndStartRecording}
                onStop={recording.stopRecording}
                onReset={recording.resetRecording}
              />
            ) : (
              <Card style={styles.rerecordTrigger}>
                <SectionKicker>{t('wordCreate.step1Recording')}</SectionKicker>
                <PillButton full label={t('sessionSetup.rerecord')} onPress={handleStartRerecord} variant="ghost" />
              </Card>
            )
          )}

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
            label={isSaving ? t('common.saving') : t('common.save')}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteBtn: {
    backgroundColor: 'rgba(231,111,81,0.10)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  deleteBtnText: {
    color: PetHubColors.accentCoral,
    fontSize: 13,
    fontWeight: '600',
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
  rerecordTrigger: {
    gap: Spacing.sectionHeadGap,
  },
});
