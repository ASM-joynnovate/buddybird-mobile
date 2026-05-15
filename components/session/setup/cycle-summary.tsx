import { StyleSheet, Text, View } from 'react-native';

import { PetHubColors } from '@/constants/theme';

interface CycleSummaryProps {
  sessionMins: number;
  learnSecs: number;
  restSecs: number;
  totalCycles: number;
}

function formatDuration(secs: number): string {
  return secs >= 60 ? `${Math.round(secs / 60)}분` : `${secs}초`;
}

export function CycleSummary({ sessionMins, learnSecs, restSecs, totalCycles }: CycleSummaryProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.cell, styles.cellDark]}>
        <Text style={[styles.value, styles.valueDark]}>{sessionMins}분</Text>
        <Text style={[styles.label, styles.labelDark]}>총 세션 시간</Text>
      </View>
      <View style={[styles.cell, styles.cellTeal]}>
        <Text style={[styles.value, styles.valueTeal]}>{formatDuration(learnSecs)}</Text>
        <Text style={[styles.label, styles.labelTeal]}>학습</Text>
      </View>
      <View style={[styles.cell, styles.cellCoral]}>
        <Text style={[styles.value, styles.valueCoral]}>{formatDuration(restSecs)}</Text>
        <Text style={[styles.label, styles.labelCoral]}>휴식</Text>
      </View>
      <View style={[styles.cell, styles.cellCream]}>
        <Text style={[styles.value, styles.valueCream]}>{totalCycles}</Text>
        <Text style={[styles.label, styles.labelCream]}>사이클</Text>
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
  cellDark: { backgroundColor: PetHubColors.primary },
  cellTeal: { backgroundColor: PetHubColors.secondary },
  cellCoral: { backgroundColor: PetHubColors.accentCoral },
  cellCream: { backgroundColor: '#FAF6F0' },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  valueDark: { color: '#FAF6F0' },
  valueTeal: { color: '#FAF6F0' },
  valueCoral: { color: '#FAF6F0' },
  valueCream: { color: PetHubColors.primary },
  label: { fontSize: 9, fontWeight: '500', letterSpacing: 0.5, marginTop: 2, opacity: 0.65 },
  labelDark: { color: '#FAF6F0' },
  labelTeal: { color: '#FAF6F0' },
  labelCoral: { color: '#FAF6F0' },
  labelCream: { color: PetHubColors.primary },
});
