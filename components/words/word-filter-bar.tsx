import { ScrollView, StyleSheet } from 'react-native';

import { Chip, type ChipTone } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { WordCategory } from '@/features/word-library/word-categories';

interface WordFilterBarProps {
  cats: readonly WordCategory[];
  active: WordCategory;
  onChange: (next: WordCategory) => void;
}

export function WordFilterBar({ cats, active, onChange }: WordFilterBarProps) {
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
  cat: WordCategory;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ cat, active, onPress }: FilterChipProps) {
  const { t } = useI18n();
  const label = cat === 'all' ? t('wordLibrary.filterAll') : t(`wordLibrary.tagLabels.${cat}`);
  return <Chip active={active} label={label} onPress={onPress} tone={toneByCategory[cat] ?? 'primary'} />;
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
  all: 'primary',
  greeting: 'primary',
  food: 'blue',
  name: 'purple',
  etc: 'primary',
};
