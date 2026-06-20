import { StyleSheet, Text, View } from 'react-native';

import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';

interface ProgressStripProps {
  label: string;
  valueLabel: string;
  progress: number;
}

export function ProgressStrip({ label, valueLabel, progress }: ProgressStripProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.wrap}>
      <View style={styles.copyRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueLabel}</Text>
      </View>
      <View
        accessibilityLabel={`${label} ${valueLabel}`}
        accessibilityRole="progressbar"
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.chipGap,
  },
  copyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.caption,
    color: BuddyBirdColors.ink,
  },
  value: {
    ...Typography.caption,
    color: BuddyBirdColors.inkMuted,
  },
  track: {
    backgroundColor: BuddyBirdColors.surfaceMuted,
    borderRadius: Radii.full,
    height: 14,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.full,
    height: '100%',
  },
});
