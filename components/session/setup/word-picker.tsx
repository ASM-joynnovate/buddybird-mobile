import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

import { WordPickerCard } from './word-picker-card';

const ROW_GAP = 8;

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
  sectionTitle: string;
  emptyLabel: string;
}

export function WordPicker({
  items,
  selectedId,
  onSelect,
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
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.tileCell}>
            <WordPickerCard
              active={selectedId === item.id}
              id={item.id}
              label={item.label}
              onSelect={onSelect}
              tag={item.tag}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sectionHeadGap,
  },
  head: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: BuddyBirdColors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    rowGap: ROW_GAP,
  },
  tileCell: {
    maxWidth: '33.333333%',
    paddingHorizontal: 4,
    width: '33.333333%',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderWidth: 2,
    borderRadius: Radii.card,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyText: {
    color: BuddyBirdColors.bodyMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
