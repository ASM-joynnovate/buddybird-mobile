import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip, type ChipTone } from '@/components/ui/chip';
import { SectionKicker } from '@/components/ui/section-kicker';
import { Spacing } from '@/constants/theme';
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
          return (
            <Chip
              active={active}
              key={tag}
              label={tag}
              onPress={() => onSelect(tag)}
              tone={toneByTag[tag] ?? 'purple'}
            />
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
});

const toneByTag: Record<string, ChipTone> = {
  인사: 'primary',
  음식: 'blue',
  이름: 'purple',
  기타: 'primary',
};
