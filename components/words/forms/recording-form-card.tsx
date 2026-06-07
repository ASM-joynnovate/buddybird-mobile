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
  elapsedSeconds?: number;
  playElapsedSeconds?: number;
  recordingStatusLabel: string;
  recordedStatusLabel: string;
  startLabel: string;
  stopLabel: string;
  rerecordLabel: string;
  playLabel?: string;
  stopPlayLabel?: string;
  isPlaying?: boolean;
  isRerecording?: boolean;
  errorMessage: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onPlay?: () => void;
  onStopPlay?: () => void;
}

export function RecordingFormCard({
  label,
  body,
  metering,
  lifecycle,
  elapsedSeconds,
  playElapsedSeconds,
  recordingStatusLabel,
  recordedStatusLabel,
  startLabel,
  stopLabel,
  rerecordLabel,
  playLabel = '녹음 재생',
  stopPlayLabel = '중단',
  isPlaying = false,
  isRerecording = false,
  errorMessage,
  onStart,
  onStop,
  onReset,
  onPlay,
  onStopPlay,
}: RecordingFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>{label}</SectionKicker>
      <Text style={styles.bodySmall}>{body}</Text>
      <WaveformPlaceholder
        metering={metering}
        state={
          (lifecycle === 'recording' || (isRerecording && (lifecycle === 'idle' || lifecycle === 'requesting-permission'))) ? 'recording'
          : lifecycle === 'recorded' && isPlaying ? 'playing'
          : lifecycle === 'recorded' ? 'recorded'
          : 'idle'
        }
        statusLabel={
          (lifecycle === 'recording' || (isRerecording && (lifecycle === 'idle' || lifecycle === 'requesting-permission')))
            ? `${recordingStatusLabel}${elapsedSeconds != null ? ` · ${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}` : ''}`
          : lifecycle === 'recorded'
            ? `${recordedStatusLabel}${isPlaying && playElapsedSeconds != null ? ` · ${String(Math.floor(playElapsedSeconds / 60)).padStart(2, '0')}:${String(playElapsedSeconds % 60).padStart(2, '0')}` : ''}`
          : undefined
        }
      />
      <View style={styles.btns}>
        {((lifecycle === 'idle' && !isRerecording) || lifecycle === 'error' || (lifecycle === 'requesting-permission' && !isRerecording)) && (
          <PillButton
            disabled={lifecycle === 'requesting-permission'}
            full
            label={startLabel}
            onPress={onStart}
            variant="teal"
          />
        )}
        {(lifecycle === 'recording' || (isRerecording && (lifecycle === 'idle' || lifecycle === 'requesting-permission'))) && (
          <PillButton disabled={lifecycle !== 'recording'} full label={stopLabel} onPress={onStop} variant="primary" />
        )}
        {lifecycle === 'recorded' && (
          <>
            {isPlaying ? (
              <PillButton label={stopPlayLabel} onPress={onStopPlay} style={styles.flex1} variant="primary" />
            ) : (
              <PillButton label={playLabel} onPress={onPlay} style={styles.flex1} variant="teal" />
            )}
            <PillButton label={rerecordLabel} onPress={onReset} style={styles.flex1} variant="ghost" />
          </>
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
  flex1: {
    flex: 1,
  },
});
