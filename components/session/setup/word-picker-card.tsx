import { StyleSheet, Text, View } from 'react-native';

import { SelectableRowCard } from '@/components/ui/selectable-row-card';
import { BuddyBirdColors, Radii } from '@/constants/theme';
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
  const col = catColors[tag] ?? BuddyBirdColors.secondary;

  return (
    <SelectableRowCard active={active} onPress={onSelect}>
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
    </SelectableRowCard>
  );
}

const styles = StyleSheet.create({
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
    color: BuddyBirdColors.primary,
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
    backgroundColor: 'transparent',
    borderColor: BuddyBirdColors.borderMuted,
    borderWidth: 1,
  },
  sourcePillRecording: {
    backgroundColor: 'transparent',
    borderColor: BuddyBirdColors.feather,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePillTextPreset: {
    color: BuddyBirdColors.kickerMuted,
  },
  sourcePillTextRecording: {
    color: BuddyBirdColors.tertiaryDeep,
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
});
