import { StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

const barHeights = [18, 32, 24, 48, 30, 56, 22, 38, 28, 50, 20, 44, 34, 26, 52, 24];

type WaveformState = 'idle' | 'recording' | 'recorded' | 'pitch-applied' | 'preview-disabled';

interface WaveformPlaceholderProps {
  state?: WaveformState;
  statusLabel?: string;
  helperText?: string;
}

export function WaveformPlaceholder({ state = 'idle', statusLabel, helperText }: WaveformPlaceholderProps) {
  const { t } = useI18n();
  const isMuted = state === 'preview-disabled';
  const isRecording = state === 'recording';

  return (
    <View style={[styles.container, isMuted ? styles.mutedContainer : undefined]}>
      <View accessibilityLabel={t('audio.waveformPreviewLabel')} style={styles.waveform}>
        {barHeights.map((height, index) => (
          <View
            key={`${height}-${index}`}
            style={[
              styles.bar,
              isRecording ? styles.recordingBar : undefined,
              isMuted ? styles.mutedBar : undefined,
              {
                height: isRecording && index % 3 === 0 ? height + 8 : height,
                opacity: index > 4 && index < 11 ? 1 : 0.42,
              },
            ]}
          />
        ))}
      </View>
      {statusLabel || helperText ? (
        <View style={styles.copyBlock}>
          {statusLabel ? <Text style={[styles.statusLabel, isMuted ? styles.mutedText : undefined]}>{statusLabel}</Text> : null}
          {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31,58,61,0.05)',
    borderRadius: Radii.sectionCard,
    gap: Spacing.tabPaddingY,
    paddingHorizontal: Spacing.cardPaddingSm,
    paddingVertical: Spacing.tabPaddingY,
  },
  mutedContainer: {
    backgroundColor: 'rgba(31,58,61,0.035)',
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.waveformGap,
    height: 78,
    justifyContent: 'center',
  },
  bar: {
    backgroundColor: PetHubColors.secondary,
    borderRadius: 2,
    width: 5,
  },
  recordingBar: {
    backgroundColor: PetHubColors.accentCoral,
  },
  mutedBar: {
    backgroundColor: 'rgba(31,58,61,0.28)',
  },
  copyBlock: {
    gap: Spacing.micro,
  },
  statusLabel: {
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  helperText: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.62)',
  },
  mutedText: {
    color: 'rgba(31,58,61,0.56)',
  },
});
