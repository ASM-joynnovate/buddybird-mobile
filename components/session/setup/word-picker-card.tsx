import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PetHubColors, Radii } from '@/constants/theme';
import { catColors } from '@/features/training/session-words-mock';

interface WordPickerCardProps {
  label: string;
  tag: string;
  sourceType: 'preset' | 'recording';
  sourceLabel: string;
  sessionCountLabel: string;
  active: boolean;
  onSelect: () => void;
}

export function WordPickerCard({
  label,
  tag,
  sourceType,
  sourceLabel,
  sessionCountLabel,
  active,
  onSelect,
}: WordPickerCardProps) {
  const isPreset = sourceType === 'preset';
  const col = catColors[tag] ?? PetHubColors.secondary;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onSelect} style={[styles.card, active && styles.cardActive]}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={[styles.phrase, active && styles.phraseActive]}>{label}</Text>
          <View style={styles.tagsRow}>
            <View
              style={[
                styles.sourcePill,
                active
                  ? styles.pillActive
                  : isPreset
                    ? styles.sourcePillPreset
                    : styles.sourcePillRecording,
              ]}
            >
              <Text
                style={[
                  styles.sourcePillText,
                  active
                    ? styles.pillTextActive
                    : isPreset
                      ? styles.sourcePillTextPreset
                      : styles.sourcePillTextRecording,
                ]}
              >
                {sourceLabel}
              </Text>
            </View>
            <View style={[styles.catPill, active ? styles.pillActive : { backgroundColor: `${col}18` }]}>
              <Text style={[styles.catPillText, active ? styles.pillTextActive : { color: col }]}>{tag}</Text>
            </View>
          </View>
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
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  phrase: {
    color: PetHubColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  phraseActive: { color: '#FAF6F0' },
  sourcePill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourcePillPreset: {
    backgroundColor: 'rgba(31,58,61,0.06)',
  },
  sourcePillRecording: {
    backgroundColor: 'rgba(42,157,143,0.12)',
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePillTextPreset: {
    color: 'rgba(31,58,61,0.45)',
  },
  sourcePillTextRecording: {
    color: PetHubColors.secondary,
  },
  catPill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pillActive: {
    backgroundColor: 'rgba(250,246,240,0.18)',
  },
  pillTextActive: {
    color: 'rgba(250,246,240,0.85)',
  },
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
