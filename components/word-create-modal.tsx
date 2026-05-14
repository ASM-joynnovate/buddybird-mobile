import Slider from '@react-native-community/slider';
import { useState } from 'react';
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
import type { WordPersonaId, WordTag } from '@/features/word-library/word-library-types';

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
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<WordPersonaId>('child');
  const [isSaving, setIsSaving] = useState(false);

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

  const canSave = recordingLifecycle === 'recorded' && recordingFile !== null && label.trim().length > 0;

  function handleClose() {
    resetRecording();
    setLabel('');
    setTag('인사');
    setTarget(2.8);
    setPersona('child');
    onClose();
  }

  async function handleSave() {
    if (!canSave || !recordingFile) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso);
      await createEntry({
        label: label.trim(),
        tag,
        sourceType: 'recording',
        audioUri: recordingFile.uri,
        pitchTransform,
        targetFrequencyKHz: target,
        personaId: persona,
      });
      handleClose();
      onCreated();
    } catch {
      Alert.alert('저장 실패', '단어를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
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
          {/* Step 1: 녹음 */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>{t('wordCreate.step1Recording')}</Text>
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
                <PillButton full label={t('sessionSetup.stopRecording')} onPress={stopRecording} variant="primary" />
              )}
              {recordingLifecycle === 'recorded' && (
                <PillButton full label={t('sessionSetup.rerecord')} onPress={resetRecording} variant="ghost" />
              )}
            </View>
            {recordingErrorMessage ? <Text style={styles.error}>{recordingErrorMessage}</Text> : null}
          </Card>

          {/* Step 2: 단어 이름 */}
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

          {/* Step 3: 태그 */}
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

          {/* Step 4: 톤 설정 */}
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

          {/* 저장 버튼 */}
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
