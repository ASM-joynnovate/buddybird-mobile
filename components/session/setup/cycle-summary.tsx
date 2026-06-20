import { StyleSheet, Text, View } from 'react-native';

import { LedgeView } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { formatDurationMins } from '@/features/shared/duration-format';
import { deriveSessionCycles } from '@/features/training/session-cycle-model';

interface CycleSummaryProps {
  sessionMins: number;
  learnSecs: number;
  restSecs: number;
}

export function CycleSummary({ sessionMins, learnSecs, restSecs }: CycleSummaryProps) {
  const { totalCycles: cycles } = deriveSessionCycles({ totalSeconds: sessionMins * 60, learnSecs, restSecs });
  const learnMins = Math.round((cycles * learnSecs) / 60);
  const restMins = Math.round((cycles * restSecs) / 60);

  return (
    <LedgeView baseStyle={styles.base} depth="card" faceStyle={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>총 학습 시간 · {cycles}회 반복</Text>
        <Text style={styles.headerValue}>{formatDurationMins(sessionMins)}</Text>
      </View>
      <View style={styles.detailRow}>
        <View style={[styles.cell, styles.cellDivider]}>
          <View style={styles.metricLabelRow}>
            <View style={[styles.dot, styles.dotLearn]} />
            <Text style={styles.label}>학습</Text>
          </View>
          <Text style={[styles.value, styles.valueLearn]}>{formatDurationMins(learnMins)}</Text>
        </View>
        <View style={styles.cell}>
          <View style={styles.metricLabelRow}>
            <View style={[styles.dot, styles.dotRest]} />
            <Text style={styles.label}>휴식</Text>
          </View>
          <Text style={[styles.value, styles.valueRest]}>{formatDurationMins(restMins)}</Text>
        </View>
      </View>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.card,
  },
  card: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.card,
    borderWidth: 2,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface1,
    borderBottomColor: BuddyBirdColors.borderMuted,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.cardPaddingSm,
  },
  headerLabel: {
    color: BuddyBirdColors.inkMuted,
    flex: 1,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13,
    fontWeight: '800',
  },
  headerValue: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 17,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'flex-start',
    gap: Spacing.micro,
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.cardPaddingSm,
  },
  cellDivider: {
    borderRightColor: BuddyBirdColors.borderMuted,
    borderRightWidth: 2,
  },
  metricLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dot: {
    borderRadius: Radii.pill,
    height: 9,
    width: 9,
  },
  dotLearn: { backgroundColor: BuddyBirdColors.primary },
  dotRest: { backgroundColor: BuddyBirdColors.secondary },
  value: {
    ...Typography.value,
    fontSize: 18,
    letterSpacing: 0,
  },
  valueLearn: { color: BuddyBirdColors.primary },
  valueRest: { color: BuddyBirdColors.secondary },
  label: {
    ...Typography.caption,
    color: BuddyBirdColors.inkMuted,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
