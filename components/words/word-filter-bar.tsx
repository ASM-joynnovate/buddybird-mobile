import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import { catColors } from '@/features/training/session-words-mock';

interface WordFilterBarProps<T extends string> {
  cats: readonly T[];
  active: T;
  onChange: (next: T) => void;
}

export function WordFilterBar<T extends string>({ cats, active, onChange }: WordFilterBarProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {cats.map((c) => (
        <FilterChip key={c} cat={c} active={active === c} onPress={() => onChange(c)} />
      ))}
    </ScrollView>
  );
}

interface FilterChipProps {
  cat: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ cat, active, onPress }: FilterChipProps) {
  const color = catColors[cat] ?? PetHubColors.secondary;
  return (
    <Pressable
      style={[
        styles.chip,
        active ? { backgroundColor: `${color}18`, borderColor: color } : styles.chipInactive,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color }]}>{cat}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginTop: 14,
  },
  row: {
    gap: 6,
    paddingHorizontal: Spacing.screenX,
  },
  chip: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipInactive: {
    borderColor: 'rgba(31,58,61,0.15)',
  },
  chipText: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
});
