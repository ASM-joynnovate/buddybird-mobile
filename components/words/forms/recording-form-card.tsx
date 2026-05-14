import { StyleSheet, Text, View } from 'react-native';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { Card } from '@/components/ui/card';
import { InlineError } from '@/components/ui/inline-error';
import { PillButton } from '@/components/ui/pill-button';
import { SectionKicker } from '@/components/ui/section-kicker';
import { Spacing, Typography } from '@/constants/theme';
import type { RecordingLifecycle } from '@/features/audio/audio-types';

interface RecordingFormCardProps {
  label: string;
  body: string;
  metering: number | null;
  lifecycle: RecordingLifecycle;
  recordingStatusLabel: string;
  recordedStatusLabel: string;
  startLabel: string;
  stopLabel: string;
  rerecordLabel: string;
  errorMessage: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function RecordingFormCard({
  label,
  body,
  metering,
  lifecycle,
  recordingStatusLabel,
  recordedStatusLabel,
  startLabel,
  stopLabel,
  rerecordLabel,
  errorMessage,
  onStart,
  onStop,
  onReset,
}: RecordingFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>{label}</SectionKicker>
      <Text style={styles.bodySmall}>{body}</Text>
      <WaveformPlaceholder
        metering={metering}
        state={
          lifecycle === 'recording' ? 'recording'
          : lifecycle === 'recorded' ? 'recorded'
          : 'idle'
        }
        statusLabel={
          lifecycle === 'recording' ? recordingStatusLabel
          : lifecycle === 'recorded' ? recordedStatusLabel
          : undefined
        }
      />
      <View style={styles.btns}>
        {(lifecycle === 'idle' || lifecycle === 'error' || lifecycle === 'requesting-permission') && (
          <PillButton
            disabled={lifecycle === 'requesting-permission'}
            full
            label={startLabel}
            onPress={onStart}
            variant="teal"
          />
        )}
        {lifecycle === 'recording' && (
          <PillButton full label={stopLabel} onPress={onStop} variant="primary" />
        )}
        {lifecycle === 'recorded' && (
          <PillButton full label={rerecordLabel} onPress={onReset} variant="ghost" />
        )}
      </View>
      <InlineError message={errorMessage} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sectionHeadGap,
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
  },
  btns: {
    flexDirection: 'row',
    gap: 8,
  },
});
