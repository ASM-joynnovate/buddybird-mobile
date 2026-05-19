import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '@/components/words/word-filter-bar';
import { BuddyBirdColors, Radii } from '@/constants/theme';
import { CATS, type WordCategory } from '@/features/training/session-words-mock';

import { WordPickerCard } from './word-picker-card';

const CARD_H = 72;
const CARD_GAP = 8;

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
  //getSessionCountLabel: (item: WordPickerItem) => string;
  sectionTitle: string;
  emptyLabel: string;
}

export function WordPicker({
  items,
  selectedId,
  onSelect,
  //getSessionCountLabel,
  sectionTitle,
  emptyLabel,
}: WordPickerProps) {
  const [activeCategory, setActiveCategory] = useState<WordCategory>('전체');

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  const filteredItems =
    activeCategory === '전체' ? items : items.filter((i) => i.tag === activeCategory);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATS.map((c) => (
          <FilterChip key={c} cat={c} active={activeCategory === c} onPress={() => setActiveCategory(c)} />
        ))}
      </ScrollView>
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
      >
        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>해당 카테고리에 단어가 없습니다</Text>
        ) : (
          filteredItems.map((item) => (
            <WordPickerCard
              key={item.id}
              label={item.label}
              tag={item.tag}
              sourceType={item.sourceType}
              sourceLabel={item.sourceLabel}
              //sessionCountLabel={getSessionCountLabel(item)}
              active={selectedId === item.id}
              onSelect={() => onSelect(item.id)}
            />
          ))
        )}
      </ScrollView>
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
  sectionTitle: {
    color: BuddyBirdColors.primary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  filterRow: {
    gap: 6,
    paddingVertical: 4,
  },
  listScroll: {
    backgroundColor: 'rgba(31,58,61,0.04)',
    borderRadius: Radii.field,
    height: CARD_H * 3.5 + CARD_GAP * 2.5 + 16,
    padding: 8,
  },
  listContent: {
    gap: CARD_GAP,
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
