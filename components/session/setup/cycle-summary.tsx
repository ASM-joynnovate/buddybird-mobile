import { StyleSheet, Text, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';
import { formatDurationSecs, formatDurationMins } from '@/features/shared/duration-format';

interface CycleSummaryProps {
  sessionMins: number;
  learnSecs: number;
  restSecs: number;
}

export function CycleSummary({ sessionMins, learnSecs, restSecs }: CycleSummaryProps) {
  const overConstrained = learnSecs + restSecs > sessionMins * 60;

  return (
    <View style={styles.row}>
      <View style={[styles.cell, styles.cellDark, styles.cellWide]}>
        <Text style={[styles.value, styles.valueDark]}>{formatDurationMins(sessionMins)}</Text>
        <Text style={[styles.label, styles.labelDark]}>총 세션 시간</Text>
      </View>
      <View style={[styles.cell, styles.cellTeal]}>
        <Text style={[styles.value, styles.valueTeal]}>{formatDurationSecs(learnSecs, overConstrained)}</Text>
        <Text style={[styles.label, styles.labelTeal]}>학습</Text>
      </View>
      <View style={[styles.cell, styles.cellCoral]}>
        <Text style={[styles.value, styles.valueCoral]}>{formatDurationSecs(restSecs, overConstrained)}</Text>
        <Text style={[styles.label, styles.labelCoral]}>휴식</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: 20,
    borderWidth: 0.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 14,
  },
  cellDark: { backgroundColor: BuddyBirdColors.primary },
  cellWide: { flex: 2 },
  cellTeal: { backgroundColor: BuddyBirdColors.secondary },
  cellCoral: { backgroundColor: BuddyBirdColors.accentCoral },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  valueDark: { color: '#FAF6F0' },
  valueTeal: { color: '#FAF6F0' },
  valueCoral: { color: '#FAF6F0' },
  label: { fontSize: 9, fontWeight: '500', letterSpacing: 0.5, marginTop: 2, opacity: 0.65 },
  labelDark: { color: '#FAF6F0' },
  labelTeal: { color: '#FAF6F0' },
  labelCoral: { color: '#FAF6F0' },
});
