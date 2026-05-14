import { StyleSheet, Text, View } from 'react-native';

import { Radii } from '@/constants/theme';

interface StatCardProps {
  value: string;
  unit: string;
  label: string;
  tone: string;
}

export function StatCard({ value, unit, label, tone }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: tone }]}>{value}</Text>
        <Text style={[styles.unit, { color: tone }]}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.sectionCard,
    borderWidth: 0.5,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    color: 'rgba(31,58,61,0.6)',
    fontSize: 11,
    lineHeight: 14,
  },
});
