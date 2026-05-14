import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SectionKicker } from '@/components/ui/section-kicker';
import { Radii, Spacing } from '@/constants/theme';
import { catColors } from '@/features/training/session-words-mock';
import type { WordTag } from '@/features/word-library/word-library-types';

interface WordTagFieldProps {
  sectionKicker: string;
  tags: readonly WordTag[];
  selected: WordTag;
  onSelect: (tag: WordTag) => void;
}

export function WordTagField({ sectionKicker, tags, selected, onSelect }: WordTagFieldProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>{sectionKicker}</SectionKicker>
      <View style={styles.row}>
        {tags.map((tag) => {
          const active = selected === tag;
          const color = catColors[tag] ?? '#7C9885';
          return (
            <Pressable
              key={tag}
              style={[
                styles.chip,
                active ? { backgroundColor: `${color}18`, borderColor: color } : styles.chipInactive,
              ]}
              onPress={() => onSelect(tag)}
            >
              <Text style={[styles.chipText, active && { color }]}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sectionHeadGap,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
