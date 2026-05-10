import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { PetScreen } from '@/components/layout/pet-screen';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useAudioPreview } from '@/features/audio/use-audio-preview';
import { useAudioRecording } from '@/features/audio/use-audio-recording';
import { useI18n } from '@/features/i18n/i18n-context';
import { getPresetWordTemplates, getSessionTemplates, type PresetWordTemplate, type SessionTemplate } from '@/features/i18n/training-templates';
import { useTrainingData } from '@/features/training/training-context';
import { createAudioRecording, createTrainingWord } from '@/features/training/training-model';
import type { AudioPitchTransform, TrainingAudioSourceType, TrainingSessionSettings } from '@/features/training/training-types';

type SetupSource = TrainingAudioSourceType;

export default function SessionSetupScreen() {
  const { locale, t } = useI18n();
  const { errorMessage: trainingErrorMessage, isHydrated, saveLastSessionSettings, upsertRecording, upsertWord } = useTrainingData();
  const presetWords = useMemo(() => getPresetWordTemplates(locale), [locale]);
  const sessionTemplates = useMemo(() => getSessionTemplates(locale), [locale]);
  const [source, setSource] = useState<SetupSource>('preset');
  const [selectedPresetId, setSelectedPresetId] = useState(presetWords[0]?.id ?? '');
  const [selectedSessionId, setSelectedSessionId] = useState(sessionTemplates[0]?.id ?? '');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const selectedPreset = presetWords.find((preset) => preset.id === selectedPresetId) ?? presetWords[0];
  const selectedSession = sessionTemplates.find((session) => session.id === selectedSessionId) ?? sessionTemplates[0];
  const recording = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
  });
  const previewUri = source === 'recording' ? recording.recordingFile?.uri : null;
  const preview = useAudioPreview(previewUri);
  const canContinue = isHydrated && (source === 'preset' ? Boolean(selectedPreset) : Boolean(recording.recordingFile));

  async function saveSessionSetup(): Promise<void> {
    if (!isHydrated) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return;
    }

    if (!selectedSession) {
      setSaveErrorMessage(t('sessionSetup.selectTemplateError'));
      return;
    }

    if (!canContinue) {
      setSaveErrorMessage(t('sessionSetup.selectAudioError'));
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso) as AudioPitchTransform;
      const recordingEntity =
        source === 'recording' && recording.recordingFile
          ? createAudioRecording(
              {
                originalUri: recording.recordingFile.uri,
                pitchTransform,
              },
              nowIso
            )
          : null;
      const word = createTrainingWord(
        {
          audioUri: recordingEntity?.originalUri ?? `preset://${selectedPreset.id}`,
          locale,
          label: selectedPreset.phrase,
          presetKey: source === 'preset' ? selectedPreset.id : undefined,
          recordingId: recordingEntity?.id,
          sourceType: source,
          pitchTransform,
        },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: selectedSession.learningDurationSeconds,
        restDurationSeconds: selectedSession.restDurationSeconds,
        sourceType: source,
        totalDurationSeconds: selectedSession.totalDurationSeconds,
        wordId: word.id,
      };

      if (recordingEntity) {
        await upsertRecording(recordingEntity);
      }

      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      setSavedMessage(t('sessionSetup.savedMessage'));
      router.replace('/');
    } catch {
      setSavedMessage(null);
      setSaveErrorMessage(t('sessionSetup.saveError'));
    }
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('sessionSetup.kicker')}</Text>
        <Text style={styles.title}>{t('sessionSetup.title')}</Text>
        <Text style={styles.body}>{t('sessionSetup.body')}</Text>
      </View>

      <FormField label={t('sessionSetup.sourceLabel')}>
        <View style={styles.chips}>
          <Chip active={source === 'preset'} label={t('sessionSetup.presetSource')} onPress={() => setSource('preset')} tone="teal" />
          <Chip active={source === 'recording'} label={t('sessionSetup.recordingSource')} onPress={() => setSource('recording')} tone="coral" />
        </View>
      </FormField>

      {source === 'preset' ? (
        <PresetSourceCard presets={presetWords} selectedPresetId={selectedPresetId} onSelectPreset={setSelectedPresetId} />
      ) : (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('sessionSetup.recordingLabel')}</Text>
          <Text style={styles.bodySmall}>{t('sessionSetup.recordingBody')}</Text>
          <WaveformPlaceholder
            helperText={recording.recordingFile?.fileName ?? recording.errorMessage ?? t('sessionSetup.recordingBody')}
            state={recording.isRecording ? 'recording' : recording.recordingFile ? 'recorded' : 'idle'}
            statusLabel={recording.isRecording ? t('sessionSetup.recordingStatus') : recording.recordingFile ? t('sessionSetup.recordedStatus') : t('sessionSetup.recordingLabel')}
          />
          {recording.errorMessage ? <Text style={styles.error}>{recording.errorMessage}</Text> : null}
          <View style={styles.actions}>
            {recording.isRecording ? (
              <PillButton full label={t('sessionSetup.stopRecording')} onPress={recording.stopRecording} variant="primary" />
            ) : (
              <PillButton full label={recording.recordingFile ? t('sessionSetup.rerecord') : t('sessionSetup.startRecording')} onPress={recording.requestAndStartRecording} variant="primary" />
            )}
          </View>
        </Card>
      )}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('sessionSetup.confirmAudioTitle')}</Text>
        <WaveformPlaceholder
          helperText={source === 'preset' ? t('sessionSetup.presetPreviewDisabledBody') : t('sessionSetup.pitchAppliedBody')}
          state={source === 'preset' ? 'preview-disabled' : recording.recordingFile ? 'pitch-applied' : 'idle'}
          statusLabel={source === 'preset' ? t('sessionSetup.presetPreviewDisabledTitle') : recording.recordingFile ? t('sessionSetup.pitchAppliedStatus') : t('sessionSetup.confirmAudioTitle')}
        />
        <View style={styles.pitchBox}>
          <Text style={styles.pitchTitle}>{t('pitch.profileName')}</Text>
          <Text style={styles.bodySmall}>{t('pitch.profileDescription')}</Text>
        </View>
        <PillButton
          disabled={!preview.canPreview}
          full
          label={preview.canPreview ? t('sessionSetup.previewCta') : t('sessionSetup.previewDisabledCta')}
          onPress={preview.playPreview}
          variant="ghost"
        />
        {preview.previewState === 'error' ? <Text style={styles.error}>{t('audioErrors.previewFailed')}</Text> : null}
      </Card>

      <FormField label={t('sessionSetup.sessionTemplateLabel')}>
        <View style={styles.templateList}>
          {sessionTemplates.map((session) => (
            <TemplateOption key={session.id} active={selectedSessionId === session.id} session={session} onSelect={() => setSelectedSessionId(session.id)} />
          ))}
        </View>
      </FormField>

      {!isHydrated ? <Text style={styles.bodySmall}>{t('sessionSetup.storeLoading')}</Text> : null}
      {trainingErrorMessage ? <Text style={styles.error}>{trainingErrorMessage}</Text> : null}
      {saveErrorMessage ? <Text style={styles.error}>{saveErrorMessage}</Text> : null}
      {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}
      <PillButton disabled={!canContinue} full label={t('sessionSetup.saveCta')} onPress={saveSessionSetup} size="lg" variant="teal" />
    </PetScreen>
  );
}

interface PresetSourceCardProps {
  presets: PresetWordTemplate[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
}

function PresetSourceCard({ presets, selectedPresetId, onSelectPreset }: PresetSourceCardProps) {
  const { t } = useI18n();

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('sessionSetup.presetLabel')}</Text>
      <View style={styles.chips}>
        {presets.map((preset) => (
          <Chip key={preset.id} active={selectedPresetId === preset.id} label={preset.label} onPress={() => onSelectPreset(preset.id)} tone="sun" />
        ))}
      </View>
      {presets.map((preset) =>
        selectedPresetId === preset.id ? (
          <View key={preset.id} style={styles.selectedPresetBox}>
            <Text style={styles.selectedPresetText}>{preset.phrase}</Text>
            <Text style={styles.bodySmall}>{preset.description}</Text>
          </View>
        ) : null
      )}
    </Card>
  );
}

interface TemplateOptionProps {
  active: boolean;
  session: SessionTemplate;
  onSelect: () => void;
}

function TemplateOption({ active, session, onSelect }: TemplateOptionProps) {
  return (
    <Card style={[styles.templateOption, active ? styles.activeTemplate : undefined]}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateTitle}>{session.label}</Text>
        <Chip active={active} label={formatMinutes(session.totalDurationSeconds)} onPress={onSelect} tone="teal" />
      </View>
      <Text style={styles.bodySmall}>{session.description}</Text>
    </Card>
  );
}

function formatMinutes(totalSeconds: number): string {
  return `${Math.round(totalSeconds / 60)}m`;
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
  },
  header: {
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: PetHubColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.chipGap,
  },
  sectionCard: {
    gap: Spacing.cardPaddingSm,
  },
  sectionTitle: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  selectedPresetBox: {
    backgroundColor: PetHubColors.feather,
    borderRadius: Radii.sectionCard,
    gap: Spacing.micro,
    padding: Spacing.cardPaddingSm,
  },
  selectedPresetText: {
    ...Typography.cardTitle,
    color: PetHubColors.primary,
  },
  pitchBox: {
    backgroundColor: PetHubColors.secondaryTint,
    borderRadius: Radii.field,
    gap: Spacing.micro,
    padding: Spacing.cardPaddingSm,
  },
  pitchTitle: {
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sectionHeadGap,
  },
  templateList: {
    gap: Spacing.tabPaddingY,
  },
  templateOption: {
    gap: Spacing.tabPaddingY,
  },
  activeTemplate: {
    borderColor: PetHubColors.secondary,
    borderWidth: 2,
  },
  templateHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sectionHeadGap,
    justifyContent: 'space-between',
  },
  templateTitle: {
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  error: {
    ...Typography.bodySmall,
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
  success: {
    ...Typography.bodySmall,
    color: PetHubColors.secondaryDeep,
    fontWeight: '700',
  },
});
