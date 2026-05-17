import { StyleSheet, Text, View } from 'react-native';

import { SectionKicker } from '@/components/ui/section-kicker';
import { BuddyBirdColors } from '@/constants/theme';

import { WordPickerCard } from './word-picker-card';

export interface WordPickerItem {
  id: string;
  label: string;
  tag: string;
  presetKey?: string;
  sourceType: 'preset' | 'recording';
  sourceLabel: string;
}

interface WordPickerProps {
  items: WordPickerItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getSessionCountLabel: (item: WordPickerItem) => string;
  sectionTitle: string;
  emptyLabel: string;
}

export function WordPicker({
  items,
  selectedId,
  onSelect,
  getSessionCountLabel,
  sectionTitle,
  emptyLabel,
}: WordPickerProps) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <SectionKicker>{sectionTitle}</SectionKicker>
      </View>
      {items.map((item) => (
        <WordPickerCard
          key={item.id}
          label={item.label}
          tag={item.tag}
          sourceType={item.sourceType}
          sourceLabel={item.sourceLabel}
          sessionCountLabel={getSessionCountLabel(item)}
          active={selectedId === item.id}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  head: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.04)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyText: {
    color: BuddyBirdColors.kickerMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
