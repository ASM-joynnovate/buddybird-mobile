import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { Card } from '@/components/ui/card';
import { FreqBandViz } from '@/components/ui/freq-band-viz';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useAudioRecording } from '@/features/audio/use-audio-recording';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry, WordPersonaId, WordTag } from '@/features/word-library/word-library-types';

const TAGS: WordTag[] = ['인사', '음식', '이름', '기타'];

const TAG_COLORS: Record<WordTag, string> = {
  인사: '#2A9D8F',
  음식: '#F4A261',
  이름: '#E76F51',
  기타: '#7C9885',
};

const PERSONAS: { id: WordPersonaId; label: string; range: string }[] = [
  { id: 'child', label: '아이 톤', range: '2.5–3.5 kHz' },
  { id: 'female', label: '여성 톤', range: '1.5–2.5 kHz' },
  { id: 'bird', label: '새 모방 톤', range: '3.5–4.0 kHz' },
];

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
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<WordPersonaId>('child');
  const [isRerecording, setIsRerecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setLabel(entry.label);
      setTag(entry.tag);
      setTarget(entry.targetFrequencyKHz ?? 2.8);
      setPersona(entry.personaId ?? 'child');
      setIsRerecording(false);
    }
  }, [entry]);

  const {
    errorMessage: recordingErrorMessage,
    lifecycle: recordingLifecycle,
    metering,
    recordingFile,
    requestAndStartRecording,
    resetRecording,
    stopRecording,
  } = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  const canSave =
    label.trim().length > 0 &&
    (!isRerecording || (recordingLifecycle === 'recorded' && recordingFile !== null));

  function handleClose() {
    resetRecording();
    setIsRerecording(false);
    onClose();
  }

  async function handleSave() {
    if (!entry || !canSave) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      let audioUri = entry.audioUri;
      let pitchTransform = entry.pitchTransform;

      if (isRerecording && recordingFile) {
        audioUri = recordingFile.uri;
        pitchTransform = createMvpPitchTransform(nowIso);
      }

      await updateEntry({
        ...entry,
        label: label.trim(),
        tag,
        audioUri,
        pitchTransform,
        targetFrequencyKHz: target,
        personaId: persona,
        updatedAt: nowIso,
      });
      handleClose();
      onSaved();
    } catch {
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
          } catch {
            Alert.alert('삭제 실패', '단어를 삭제하지 못했어요. 다시 시도해 주세요.');
          }
        },
      },
    ]);
  }

  function handleStartRerecord() {
    resetRecording();
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
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionKicker}>{t('wordCreate.step1Recording')}</Text>
              {isRerecording ? (
                <>
                  <WaveformPlaceholder
                    metering={metering}
                    state={
                      recordingLifecycle === 'recording'
                        ? 'recording'
                        : recordingLifecycle === 'recorded'
                          ? 'recorded'
                          : 'idle'
                    }
                    statusLabel={
                      recordingLifecycle === 'recording'
                        ? t('sessionSetup.recordingStatus')
                        : recordingLifecycle === 'recorded'
                          ? t('sessionSetup.recordedStatus')
                          : undefined
                    }
                  />
                  <View style={styles.recorderBtns}>
                    {(recordingLifecycle === 'idle' ||
                      recordingLifecycle === 'error' ||
                      recordingLifecycle === 'requesting-permission') && (
                      <PillButton
                        disabled={recordingLifecycle === 'requesting-permission'}
                        full
                        label={t('sessionSetup.startRecording')}
                        onPress={requestAndStartRecording}
                        variant="teal"
                      />
                    )}
                    {recordingLifecycle === 'recording' && (
                      <PillButton
                        full
                        label={t('sessionSetup.stopRecording')}
                        onPress={stopRecording}
                        variant="primary"
                      />
                    )}
                    {recordingLifecycle === 'recorded' && (
                      <PillButton
                        full
                        label={t('sessionSetup.rerecord')}
                        onPress={resetRecording}
                        variant="ghost"
                      />
                    )}
                  </View>
                  {recordingErrorMessage ? <Text style={styles.error}>{recordingErrorMessage}</Text> : null}
                </>
              ) : (
                <PillButton full label={t('sessionSetup.rerecord')} onPress={handleStartRerecord} variant="ghost" />
              )}
            </Card>
          )}

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>{t('wordCreate.step2Label')}</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder={t('wordCreate.labelPlaceholder')}
              placeholderTextColor="rgba(31,58,61,0.35)"
              returnKeyType="done"
            />
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>{t('wordCreate.step3Tag')}</Text>
            <View style={styles.tagRow}>
              {TAGS.map((c) => {
                const active = tag === c;
                const color = TAG_COLORS[c];
                return (
                  <Pressable
                    key={c}
                    style={[
                      styles.tagChip,
                      active ? { backgroundColor: `${color}18`, borderColor: color } : styles.tagChipInactive,
                    ]}
                    onPress={() => setTag(c)}
                  >
                    <Text style={[styles.tagChipText, active && { color }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>{t('wordCreate.step4Tone')}</Text>
            <Text style={styles.toneTitle}>{t('wordCreate.toneTitle')}</Text>
            <FreqBandViz low={1} high={target} color={PetHubColors.secondary} label={`${target.toFixed(1)} kHz`} />
            <Slider
              style={styles.freqSlider}
              minimumValue={1.5}
              maximumValue={4.0}
              step={0.1}
              value={target}
              minimumTrackTintColor={PetHubColors.secondary}
              maximumTrackTintColor="rgba(31,58,61,0.12)"
              thumbTintColor={PetHubColors.secondary}
              onValueChange={(v) => setTarget(Math.round(v * 10) / 10)}
            />
            <View style={styles.personaRow}>
              {PERSONAS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.75}
                  style={[styles.personaBtn, persona === p.id && styles.personaBtnActive]}
                  onPress={() => setPersona(p.id)}
                >
                  <Text style={[styles.personaLabel, persona === p.id && styles.personaLabelActive]}>{p.label}</Text>
                  <Text style={styles.personaRange}>{p.range}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

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
  sectionCard: {
    gap: Spacing.sectionHeadGap,
  },
  sectionKicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  recorderBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    color: PetHubColors.primary,
    fontSize: 15,
    height: 48,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagChipInactive: {
    borderColor: 'rgba(31,58,61,0.15)',
  },
  tagChipText: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  toneTitle: {
    color: 'rgba(31,58,61,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  freqSlider: {
    height: 36,
    width: '100%',
  },
  personaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  personaBtn: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    flex: 1,
    gap: 2,
    padding: 10,
  },
  personaBtnActive: {
    backgroundColor: 'rgba(42,157,143,0.08)',
    borderColor: PetHubColors.secondary,
    borderWidth: 1.5,
  },
  personaLabel: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  personaLabelActive: {
    color: PetHubColors.secondary,
  },
  personaRange: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  error: {
    ...Typography.bodySmall,
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
});
