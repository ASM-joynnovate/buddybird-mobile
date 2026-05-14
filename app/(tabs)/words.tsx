import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddWordForm } from '@/components/words/forms/add-word-form';
import { WordFilterBar } from '@/components/words/word-filter-bar';
import { WordListItem } from '@/components/words/word-list-item';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { CATS, INITIAL_WORDS } from '@/features/training/session-words-mock';

const ADD_CATS = ['인사', '음식', '이름', '기타'] as const;

export default function WordsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<(typeof CATS)[number]>('전체');
  const [words, setWords] = useState(INITIAL_WORDS);
  const [showAdd, setShowAdd] = useState(false);

  const visible = filter === '전체' ? words : words.filter((w) => w.cat === filter);

  function handleAdd(word: string, cat: string): void {
    setWords((ws) => [...ws, { id: Date.now(), word, cat }]);
    setShowAdd(false);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>WORDS</Text>
          <Text style={styles.title}>단어 관리</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnIcon}>+</Text>
        </Pressable>
      </View>

      <WordFilterBar cats={CATS} active={filter} onChange={setFilter} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.screenBottomTabs }]}
      >
        {showAdd && (
          <AddWordForm cats={ADD_CATS} onCancel={() => setShowAdd(false)} onAdd={handleAdd} />
        )}

        {visible.map((w) => (
          <WordListItem key={w.id} word={w.word} cat={w.cat} onPlay={() => router.push('/session-setup')} />
        ))}

        {visible.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🦜</Text>
            <Text style={styles.emptyText}>단어가 없어요. 위의 + 버튼으로 추가해 보세요!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 14,
    paddingBottom: 4,
  },
  kicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addBtnIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  list: {
    gap: 8,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(31,58,61,0.4)',
    fontSize: 14,
    textAlign: 'center',
  },
});
