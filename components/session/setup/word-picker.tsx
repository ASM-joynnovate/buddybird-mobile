import { Text } from '@/components/ui/app-text';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BuddyBirdColors, Fonts, Radii, Spacing, Typography, withAlpha } from '@/constants/theme';

import { WordPickerCard } from './word-picker-card';

const ROW_GAP = 8;
const COLS = 3;
// 카드 1개 높이: face(보더4 + 패딩24 + 아이콘34 + chipGap6 + 라벨16 = 84) + 3D ledge(cardOffset 2)
const CARD_H = 86;
// 3행(9개)까지 온전히 보이고 4행째(10번째 단어부터)가 반절 걸쳐, 스크롤로 더 볼 수 있음을 알린다.
const VISIBLE_ROWS = 3.5;
const LIST_MAX_H = CARD_H * VISIBLE_ROWS + ROW_GAP * (VISIBLE_ROWS - 1);
// 잘린 peek 행이 배경으로 부드럽게 사라지도록 목록 하단을 덮는 페이드 높이.
const FADE_H = 56;

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
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  const overflowing = items.length > COLS * Math.floor(VISIBLE_ROWS);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      </View>
      <View style={styles.listWrap}>
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            setAtTop(contentOffset.y <= 8);
            setAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - 8);
          }}>
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
        </ScrollView>
        {overflowing && !atTop ? <View pointerEvents="none" style={styles.fadeTop} /> : null}
        {overflowing && !atBottom ? <View pointerEvents="none" style={styles.fadeBottom} /> : null}
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
  listWrap: {
    position: 'relative',
  },
  list: {
    maxHeight: LIST_MAX_H,
  },
  fadeTop: {
    experimental_backgroundImage: `linear-gradient(to top, ${withAlpha(BuddyBirdColors.neutral, 0)}, ${BuddyBirdColors.neutral})`,
    height: FADE_H,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
    experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(BuddyBirdColors.neutral, 0)}, ${BuddyBirdColors.neutral})`,
    height: FADE_H,
    left: 0,
    position: 'absolute',
    right: 0,
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
