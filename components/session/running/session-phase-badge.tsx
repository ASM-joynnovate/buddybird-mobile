import { StyleSheet, Text, View } from 'react-native';

import { BuddyBirdColors, Radii, Spacing, Typography, withAlpha } from '@/constants/theme';

interface SessionPhaseBadgeProps {
  isLearning: boolean;
  cycle: number;
  totalCycles: number;
}

export function SessionPhaseBadge({ isLearning, cycle, totalCycles }: SessionPhaseBadgeProps) {
  const accent = isLearning ? BuddyBirdColors.primary : BuddyBirdColors.secondary;

  return (
    <View style={styles.row}>
      <View style={[styles.phaseBadge, { backgroundColor: withAlpha(accent, 0.12) }]}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.phaseText}>{isLearning ? '학습' : '휴식'}</Text>
      </View>
      <View style={styles.cycleBadge}>
        <Text style={styles.cycleText}>사이클 {cycle}/{totalCycles}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: 16,
  },
  phaseBadge: {
    alignItems: 'center',
    borderRadius: Radii.full,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  dot: {
    borderRadius: Radii.full,
    height: 8,
    width: 8,
  },
  phaseText: {
    ...Typography.label,
    color: BuddyBirdColors.ink,
    textTransform: 'uppercase',
  },
  cycleBadge: {
    backgroundColor: BuddyBirdColors.surface1,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.full,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cycleText: {
    color: BuddyBirdColors.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
