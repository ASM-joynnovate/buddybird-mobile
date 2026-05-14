import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PetHubColors } from '@/constants/theme';

interface WordPickerCardProps {
  label: string;
  tag: string;
  sessionCountLabel: string;
  active: boolean;
  onSelect: () => void;
}

export function WordPickerCard({ label, tag, sessionCountLabel, active, onSelect }: WordPickerCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onSelect} style={[styles.card, active && styles.cardActive]}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={[styles.phrase, active && styles.phraseActive]}>{label}</Text>
          <Text style={[styles.cat, active && styles.catActive]}>{tag}</Text>
        </View>
        <Text style={[styles.time, active && styles.timeActive]}>{sessionCountLabel}</Text>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active && <View style={styles.radioDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
  },
  cardActive: {
    backgroundColor: PetHubColors.primary,
    borderWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  textBlock: {
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  phrase: {
    color: PetHubColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  phraseActive: { color: '#FAF6F0' },
  cat: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
  },
  catActive: { color: 'rgba(250,246,240,0.55)' },
  time: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
  timeActive: { color: 'rgba(250,246,240,0.55)' },
  radio: {
    alignItems: 'center',
    borderColor: 'rgba(31,58,61,0.2)',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioActive: {
    backgroundColor: PetHubColors.secondary,
    borderWidth: 0,
  },
  radioDot: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
