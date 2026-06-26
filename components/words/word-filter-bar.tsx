import { ScrollView, StyleSheet } from 'react-native';

import { Chip, type ChipTone } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';

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
      style={styles.scroll}>
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
  return <Chip active={active} label={cat} onPress={onPress} tone={toneByCategory[cat] ?? 'primary'} />;
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginTop: 14,
  },
  row: {
    gap: 8,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 2,
    paddingBottom: 10,
  },
});

const toneByCategory: Record<string, ChipTone> = {
  전체: 'primary',
  인사: 'primary',
  음식: 'blue',
  이름: 'purple',
  기타: 'primary',
};
